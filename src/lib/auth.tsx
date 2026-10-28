import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getRolesCached, peekCachedRoles, peekCachedUser } from "@/lib/auth-cache";

export type AppRole = "client" | "engineer" | "admin" | "mini_admin" | "accountant" | "project_view_admin";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, user: session?.user ?? null, loading };
}

export function useMyRoles() {
  const { user, loading } = useSession();
  // Seed from the shared cache so the layout does not wait on a second roles fetch.
  const seededUser = peekCachedUser();
  const seededRoles = seededUser ? peekCachedRoles(seededUser.id) : null;
  const [roles, setRoles] = useState<AppRole[]>((seededRoles ?? []) as AppRole[]);
  const [rolesLoading, setRolesLoading] = useState(seededRoles === null);
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    let active = true;
    getRolesCached(user.id).then((names) => {
      if (!active) return;
      setRoles((names ?? []) as AppRole[]);
      setRolesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, loading]);
  const primaryRole: AppRole = roles.includes("admin")
    ? "admin"
    : roles.includes("accountant")
      ? "accountant"
      : roles.includes("mini_admin")
        ? "mini_admin"
        : roles.includes("engineer")
          ? "engineer"
          : roles.includes("project_view_admin")
            ? "project_view_admin"
            : "client";
  return { roles, primaryRole, loading: loading || rolesLoading, user };
}

export async function signOutClean(navigate: (opts: { to: string; replace?: boolean }) => void) {
  await supabase.auth.signOut();
  navigate({ to: "/auth", replace: true });
}

export type AnyUser = User;
