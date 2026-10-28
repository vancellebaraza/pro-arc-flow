import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Session user and roles are resolved once and reused, instead of calling
// supabase.auth.getUser() (a network round trip) and querying user_roles on
// every navigation. This is only used for UI gating and for reading user.id.
// Row Level Security and server functions still verify access on their own.

const ROLES_TTL_MS = 5 * 60 * 1000;

type RolesEntry = { userId: string; roles: string[]; at: number };

let rolesEntry: RolesEntry | null = null;
type Inflight = { userId: string; promise: Promise<string[] | null> };
let rolesInflight: Inflight | null = null;
let lastUser: User | null = null;

function clearRoles() {
  rolesEntry = null;
  rolesInflight = null;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    lastUser = session?.user ?? null;
    if (event === "SIGNED_OUT" || (rolesEntry && rolesEntry.userId !== session?.user?.id)) {
      clearRoles();
    }
  });
}

type UserResult =
  | { data: { user: User }; error: null }
  | { data: { user: null }; error: Error };

/** Drop-in for supabase.auth.getUser() that reads the local session (no network call). */
export async function getUserCached(): Promise<UserResult> {
  const { data, error } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;
  lastUser = user;
  if (error || !user) {
    return { data: { user: null }, error: error ?? new Error("Auth session missing") };
  }
  return { data: { user }, error: null };
}

/** Last user seen by getUserCached or an auth event; null until one has resolved. */
export function peekCachedUser(): User | null {
  return lastUser;
}

/** Cached role names for the user, or null if they have not been loaded yet. */
export function peekCachedRoles(userId: string): string[] | null {
  return rolesEntry && rolesEntry.userId === userId ? rolesEntry.roles : null;
}

/**
 * Role names for a user from user_roles. Cached per user for a few minutes and
 * shared between concurrent callers. Returns null if the query failed.
 */
export function getRolesCached(userId: string, opts?: { force?: boolean }): Promise<string[] | null> {
  if (
    !opts?.force &&
    rolesEntry &&
    rolesEntry.userId === userId &&
    Date.now() - rolesEntry.at < ROLES_TTL_MS
  ) {
    return Promise.resolve(rolesEntry.roles);
  }
  if (rolesInflight && rolesInflight.userId === userId) return rolesInflight.promise;

  const entry: { userId: string; promise: Promise<string[] | null> } = {
    userId,
    promise: Promise.resolve(null),
  };
  entry.promise = (async () => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const stillCurrent = rolesInflight === entry;
    if (stillCurrent) rolesInflight = null;
    if (error) return null;
    const roles = (data ?? []).map((r) => r.role as string);
    // Skip caching if the cache was cleared (sign-out / user change) while loading.
    if (stillCurrent) rolesEntry = { userId, roles, at: Date.now() };
    return roles;
  })();
  rolesInflight = entry;
  return entry.promise;
}
