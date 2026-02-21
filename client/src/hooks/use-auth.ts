import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

function sessionToUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email || null,
    firstName: user.user_metadata?.full_name?.split(" ")[0] || user.user_metadata?.name || null,
    lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null,
    profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
}

async function fetchUser(): Promise<AuthUser | null> {
  // BUG FIX 1: After OAuth redirect, Supabase stores session in URL hash (#access_token=...).
  // getSession() must be called to let Supabase parse and store it.
  // We explicitly call getSession() (not getCachedSession) every time.
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) return null;
  return sessionToUser(session.user);
}

export function getAccessToken(): Promise<string | null> {
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token || null);
}

export function useAuth() {
  const queryClient = useQueryClient();
  // Track whether we've done the initial OAuth hash parse
  const initialized = useRef(false);

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["auth-user"],
    queryFn: fetchUser,
    retry: false,
    // BUG FIX 1: Was 5 minutes — cached null after OAuth callback prevented re-auth.
    // Set to 0 so the query always reflects current session state.
    staleTime: 0,
    // Don't show stale null while re-fetching
    placeholderData: undefined,
  });

  useEffect(() => {
    // BUG FIX 1: Force a fresh user fetch on mount so OAuth callback hash is processed.
    // This covers the case where user lands on "/" after Kakao redirect.
    if (!initialized.current) {
      initialized.current = true;
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        queryClient.setQueryData(["auth-user"], sessionToUser(session.user));
      } else {
        queryClient.setQueryData(["auth-user"], null);
      }
      // Refresh usage data whenever auth changes
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth-user"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}