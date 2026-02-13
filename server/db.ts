import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function createDbConnection() {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  DATABASE_URL이 설정되지 않았습니다.");
      console.warn("   헬스체크는 동작하지만 데이터베이스 기능은 사용할 수 없습니다.");
      console.warn("   로컬 개발을 위해 .env 파일을 생성하고 DATABASE_URL을 설정하세요.");
      // 개발 모드에서는 더미 객체 반환 (실제 사용 시 에러 발생)
      return { pool: null as any, db: null as any };
    }
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  const poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
  const dbInstance = drizzle(poolInstance, { schema });
  return { pool: poolInstance, db: dbInstance };
}

const { pool, db } = createDbConnection();

// db 사용 전 체크 헬퍼
export function requireDb() {
  if (!db || !pool) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다. 데이터베이스 기능을 사용할 수 없습니다.");
  }
  return { db, pool };
}

export { db, pool };
