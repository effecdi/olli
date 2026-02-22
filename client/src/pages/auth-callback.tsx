import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // 1. Check for error in URL hash (e.g. #error=... or #error_description=...)
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const errorDesc = hashParams.get("error_description") || hashParams.get("error");
          if (errorDesc) {
            if (!cancelled) setError(errorDesc);
            return;
          }
        }

        // 2. Check for error in query params
        const searchParams = new URLSearchParams(window.location.search);
        const queryError = searchParams.get("error_description") || searchParams.get("error");
        if (queryError) {
          if (!cancelled) setError(queryError);
          return;
        }

        // 3. PKCE flow: exchange code for session
        //    detectSessionInUrl may have already consumed the code,
        //    so we try exchange first, then fall back to checking existing session.
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            // Code may have been already exchanged by detectSessionInUrl — check session instead
            console.warn("Code exchange returned error (may be already consumed):", exchangeError.message);
          }
        }

        // 4. Verify session is established (works for both PKCE and implicit flows)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session) {
          // Session established — update auth state and redirect to home
          queryClient.invalidateQueries({ queryKey: ["auth-user"] });
          window.history.replaceState(null, "", "/");
          navigate("/", { replace: true });
          return;
        }

        // 5. No session yet — listen for auth state change (auto-detection in progress)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (cancelled) return;
            if (event === "SIGNED_IN" && session) {
              queryClient.invalidateQueries({ queryKey: ["auth-user"] });
              window.history.replaceState(null, "", "/");
              navigate("/", { replace: true });
              subscription.unsubscribe();
            }
          }
        );

        // If still nothing after a brief wait, show error
        setTimeout(() => {
          if (!cancelled) {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (cancelled) return;
              if (!session) {
                setError("로그인에 실패했습니다. 다시 시도해주세요.");
              }
            });
          }
          subscription.unsubscribe();
        }, 5000);
      } catch (err) {
        console.error("Auth callback error:", err);
        if (!cancelled) setError("로그인 처리 중 오류가 발생했습니다.");
      }
    };

    handleCallback();

    // Safety timeout: prevent infinite loading
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        setError((prev) => prev ?? "로그인 응답 시간이 초과되었습니다. 다시 시도해주세요.");
      }
    }, 15000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [navigate, queryClient]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-2 pb-4">
            <h1 className="text-xl font-bold">로그인 실패</h1>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <Button className="w-full" onClick={() => navigate("/login", { replace: true })}>
              다시 로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  );
}
