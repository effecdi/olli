import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ANDROID FIX: 기본값 "implicit"은 로그인 후 URL 해시(#access_token=...)로 토큰 전달
    // 안드로이드 Chrome Custom Tab / 카카오 인앱 브라우저는 해시를 소실시킴
    // "pkce"는 URL 쿼리파람(?code=...)으로 전달 → 안드로이드에서도 안정적으로 동작
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
  },
});
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
  },
});
