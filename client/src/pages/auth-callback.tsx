import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";

export default function AuthCallbackPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isAuthenticated) {
      // Auth succeeded — clean URL and go to home
      window.history.replaceState(null, "", "/");
      navigate("/");
      return;
    }

    if (!isLoading && !isAuthenticated) {
      // Auth finished loading but no user — wait briefly for Supabase to
      // finish processing the OAuth code/hash, then give up.
      timeoutRef.current = setTimeout(() => {
        navigate("/login");
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  );
}
