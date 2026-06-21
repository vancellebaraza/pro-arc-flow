import { r as reactExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-L2Z55D81.mjs";
function useSession() {
  const [session, setSession] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
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
function useMyRoles() {
  const { user, loading } = useSession();
  const [roles, setRoles] = reactExports.useState([]);
  const [rolesLoading, setRolesLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (loading) return;
    if (!user) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      setRoles((data ?? []).map((r) => r.role));
      setRolesLoading(false);
    });
  }, [user, loading]);
  const primaryRole = roles.includes("admin") ? "admin" : roles.includes("engineer") ? "engineer" : "client";
  return { roles, primaryRole, loading: loading || rolesLoading, user };
}
async function signOutClean(navigate) {
  await supabase.auth.signOut();
  navigate({ to: "/auth", replace: true });
}
export {
  signOutClean as s,
  useMyRoles as u
};
