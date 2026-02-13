import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// 개발 모드에서 환경변수가 없으면 더미 클라이언트 생성
let supabase: ReturnType<typeof createClient>;
try {
  if (!config.supabaseUrl || !config.supabaseKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Supabase 설정이 없습니다. 인증 기능이 동작하지 않습니다.");
      // 더미 클라이언트 생성 (실제 사용 시 에러 발생)
      supabase = createClient("https://dummy.supabase.co", "dummy-key");
    } else {
      throw new Error("SUPABASE_URL and SUPABASE_KEY must be set");
    }
  } else {
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }
} catch (error) {
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️  Supabase 클라이언트 생성 실패:", error);
    supabase = createClient("https://dummy.supabase.co", "dummy-key");
  } else {
    throw error;
  }
}

export { supabase };
