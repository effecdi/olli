/**
 * Supabase auth.users 테이블의 트리거를 확인하고 문제가 있으면 제거하는 스크립트
 *
 * 실행: npx tsx scripts/check-auth-triggers.ts
 *
 * "Database error saving new user" 에러의 원인:
 * auth.users 테이블에 INSERT 시 실행되는 트리거가 실패하면 전체 트랜잭션이 롤백되어
 * Supabase Auth 자체에서 새 유저 생성이 실패합니다.
 */
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL 환경변수가 필요합니다.");
  console.error("   사용법: DATABASE_URL=postgresql://... npx tsx scripts/check-auth-triggers.ts");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log("🔍 auth.users 테이블의 트리거를 확인합니다...\n");

    // 1. auth.users 테이블의 모든 트리거 조회
    const triggers = await client.query(`
      SELECT
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth'
        AND event_object_table = 'users'
      ORDER BY trigger_name;
    `);

    if (triggers.rows.length === 0) {
      console.log("✅ auth.users 테이블에 커스텀 트리거가 없습니다.");
    } else {
      console.log(`⚠️  auth.users 테이블에 ${triggers.rows.length}개의 트리거가 발견되었습니다:\n`);
      for (const t of triggers.rows) {
        console.log(`  📌 ${t.trigger_name}`);
        console.log(`     이벤트: ${t.action_timing} ${t.event_manipulation}`);
        console.log(`     동작: ${t.action_statement}`);
        console.log();
      }
    }

    // 2. public.handle_new_user 함수 존재 여부 확인 (가장 흔한 트리거 함수)
    const functions = await client.query(`
      SELECT
        routine_name,
        routine_schema,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%' OR routine_name LIKE '%auth%')
      ORDER BY routine_name;
    `);

    if (functions.rows.length > 0) {
      console.log(`\n🔧 관련 함수 ${functions.rows.length}개 발견:\n`);
      for (const f of functions.rows) {
        console.log(`  📌 ${f.routine_schema}.${f.routine_name}()`);
      }
    }

    // 3. 상세 트리거 함수 내용 확인
    const triggerFunctions = await client.query(`
      SELECT
        n.nspname AS schema,
        p.proname AS name,
        pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype
        AND n.nspname = 'public'
      ORDER BY p.proname;
    `);

    if (triggerFunctions.rows.length > 0) {
      console.log(`\n📋 트리거 함수 상세 내용:\n`);
      for (const f of triggerFunctions.rows) {
        console.log(`--- ${f.schema}.${f.name}() ---`);
        console.log(f.definition);
        console.log();
      }
    }

    // 4. public.users 테이블 구조 확인
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    if (columns.rows.length > 0) {
      console.log("\n📊 public.users 테이블 구조:");
      for (const c of columns.rows) {
        console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`);
      }
    }

    // 5. 문제가 되는 트리거 자동 제거 (--fix 옵션)
    if (process.argv.includes("--fix")) {
      console.log("\n🔧 --fix 모드: 문제가 될 수 있는 트리거를 제거합니다...\n");

      // auth.users에 걸린 커스텀 트리거 제거
      for (const t of triggers.rows) {
        // Supabase 내장 트리거는 건드리지 않음
        if (t.trigger_name.startsWith("on_auth_user_")) {
          console.log(`  🗑️  트리거 제거: ${t.trigger_name}`);
          await client.query(`DROP TRIGGER IF EXISTS "${t.trigger_name}" ON auth.users;`);
          console.log(`  ✅ 제거 완료`);
        }
      }

      // 트리거 함수 제거
      for (const f of triggerFunctions.rows) {
        if (f.name.includes("user") || f.name.includes("profile")) {
          console.log(`  🗑️  함수 제거: ${f.schema}.${f.name}()`);
          await client.query(`DROP FUNCTION IF EXISTS ${f.schema}.${f.name}() CASCADE;`);
          console.log(`  ✅ 제거 완료`);
        }
      }

      console.log("\n✅ 정리 완료! 다시 로그인을 시도해보세요.");
    } else {
      if (triggers.rows.length > 0 || triggerFunctions.rows.length > 0) {
        console.log("\n💡 문제가 되는 트리거를 자동으로 제거하려면:");
        console.log("   DATABASE_URL=postgresql://... npx tsx scripts/check-auth-triggers.ts --fix");
        console.log("\n   또는 Supabase Dashboard → SQL Editor에서 직접 제거할 수 있습니다.");
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ 오류 발생:", err.message);
  process.exit(1);
});
