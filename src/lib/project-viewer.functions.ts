import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertCallerIsMiniAdminOrAdmin(
  supabase: { from: (t: string) => any },
  userId: string,
) {
  const { data: roleRows, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Could not verify caller role");
  const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("mini_admin") && !roles.includes("admin")) {
    throw new Error("Forbidden: only mini-admin or admin can manage project viewers");
  }
}

const CreateViewerInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  phone: z.string().optional().default(""),
  project_ids: z.array(z.string().uuid()).default([]),
});

// Creates a project_view_admin account. The role is hardcoded below —
// it is never taken from the request payload, so this cannot be abused
// to grant a different role even by a caller who forges the input shape.
export const createProjectViewAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateViewerInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsMiniAdminOrAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone },
    });
    if (createErr || !created?.user?.id) {
      throw new Error(createErr?.message || "Could not create user");
    }
    const viewerId = created.user.id;

    // handle_new_user() already inserted a default 'client' row for this
    // user — replace it with the real role.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", viewerId);
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: viewerId, role: "project_view_admin" })
      .throwOnError();

    if (data.project_ids.length > 0) {
      const rows = data.project_ids.map((project_id) => ({
        project_id,
        viewer_id: viewerId,
        assigned_by: userId,
      }));
      await supabaseAdmin.from("project_view_admin_assignments").insert(rows).throwOnError();
    }

    return { ok: true, viewer_id: viewerId };
  });

const AssignInput = z.object({
  viewer_id: z.string().uuid(),
  project_id: z.string().uuid(),
});

export const assignProjectToViewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AssignInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsMiniAdminOrAdmin(supabase, userId);

    const { error } = await supabase
      .from("project_view_admin_assignments")
      .insert({ project_id: data.project_id, viewer_id: data.viewer_id, assigned_by: userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unassignProjectFromViewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AssignInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsMiniAdminOrAdmin(supabase, userId);

    const { error } = await supabase
      .from("project_view_admin_assignments")
      .delete()
      .eq("project_id", data.project_id)
      .eq("viewer_id", data.viewer_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProjectViewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ viewer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsMiniAdminOrAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.viewer_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listProjectViewers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertCallerIsMiniAdminOrAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: viewerRoles, error: vErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "project_view_admin");
    if (vErr) throw new Error(vErr.message);
    const viewerIds = (viewerRoles ?? []).map((r: { user_id: string }) => r.user_id);
    if (viewerIds.length === 0) return { viewers: [] };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", viewerIds);

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email]));

    const { data: assignments } = await supabaseAdmin
      .from("project_view_admin_assignments")
      .select("viewer_id, project_id")
      .in("viewer_id", viewerIds);

    const projectIds = [...new Set((assignments ?? []).map((a: { project_id: string }) => a.project_id))];
    const { data: projectsData } = projectIds.length
      ? await supabaseAdmin.from("projects").select("id, title").in("id", projectIds)
      : { data: [] };
    const projectTitleMap = new Map((projectsData ?? []).map((p: { id: string; title: string }) => [p.id, p.title]));

    const viewers = viewerIds.map((id) => {
      const profile = (profiles ?? []).find((p: { id: string }) => p.id === id);
      const assignedProjects = (assignments ?? [])
        .filter((a: { viewer_id: string }) => a.viewer_id === id)
        .map((a: { project_id: string }) => ({
          id: a.project_id,
          title: projectTitleMap.get(a.project_id) ?? "Untitled",
        }));
      return {
        id,
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        email: emailMap.get(id) ?? "",
        projects: assignedProjects,
      };
    });

    return { viewers };
  });
