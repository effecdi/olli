import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

async function fetchUser(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const user = session.user;
  return {
    id: user.id,
    email: user.email || null,
    firstName: user.user_metadata?.full_name?.split(" ")[0] || user.user_metadata?.name || null,
    lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null,
    profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
}

export function getAccessToken(): Promise<string | null> {
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token || null);
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["auth-user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        queryClient.setQueryData(["auth-user"], {
          id: u.id,
          email: u.email || null,
          firstName: u.user_metadata?.full_name?.split(" ")[0] || u.user_metadata?.name || null,
          lastName: u.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null,
          profileImageUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        });
      } else {
        queryClient.setQueryData(["auth-user"], null);
      }
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
