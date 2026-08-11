import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

export function resolvePrimaryRole(roles: Array<string | null | undefined>): AppRole {
  const normalizedRoles = roles.map((role) => role?.toLowerCase()).filter(Boolean) as string[];

  if (normalizedRoles.includes("admin")) return "admin";
  if (normalizedRoles.includes("accountant")) return "accountant";
  if (normalizedRoles.includes("mini_admin")) return "mini_admin";
  if (normalizedRoles.includes("engineer")) return "engineer";
  if (normalizedRoles.includes("project_view_admin")) return "project_view_admin";
  return "client";
}

export function getRoleHomePath(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "accountant":
      return "/accountant";
    case "mini_admin":
      return "/mini-admin/Dashboard";
    case "engineer":
      return "/engineer";
    case "project_view_admin":
      return "/project-viewer";
    default:
      return "/client";
  }
}

export async function requireRole(allowedRoles: AppRole[], fallbackPath = "/auth") {
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) throw redirect({ to: fallbackPath });

  const { data: rolesData, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  if (rolesError) {
    throw redirect({ to: fallbackPath });
  }

  const primaryRole = resolvePrimaryRole((rolesData ?? []).map((role) => role.role));

  if (!allowedRoles.includes(primaryRole)) {
    throw redirect({ to: getRoleHomePath(primaryRole) });
  }

  return userData.user;
}
