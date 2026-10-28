import { redirect } from "@tanstack/react-router";
import { getRolesCached, getUserCached } from "@/lib/auth-cache";
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
  const { data: userData, error } = await getUserCached();
  if (error || !userData.user) throw redirect({ to: fallbackPath });

  const roles = await getRolesCached(userData.user.id);

  if (!roles) {
    throw redirect({ to: fallbackPath });
  }

  const primaryRole = resolvePrimaryRole(roles);

  if (!allowedRoles.includes(primaryRole)) {
    throw redirect({ to: getRoleHomePath(primaryRole) });
  }

  return userData.user;
}
