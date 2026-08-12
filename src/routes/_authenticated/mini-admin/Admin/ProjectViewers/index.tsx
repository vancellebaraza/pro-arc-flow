import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye } from "lucide-react";
import {
  createProjectViewAdmin,
  listProjectViewers,
  assignProjectToViewer,
  unassignProjectFromViewer,
} from "@/lib/project-viewer.functions";

export const Route = createFileRoute(
  "/_authenticated/mini-admin/Admin/ProjectViewers/",
)({
  component: ProjectViewersPage,
});

interface ProjectOption {
  id: string;
  title: string;
}
interface Viewer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  projects: { id: string; title: string }[];
}

function ProjectViewersPage() {
  const createViewer = useServerFn(createProjectViewAdmin);
  const listViewers = useServerFn(listProjectViewers);
  const assignProject = useServerFn(assignProjectToViewer);
  const unassignProject = useServerFn(unassignProjectFromViewer);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [busyAssignKey, setBusyAssignKey] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: projectsData, error: projectsErr }, viewersRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id,title")
          .eq("archived", false)
          .order("created_at", { ascending: false }),
        listViewers({} as any),
      ]);
      if (projectsErr) throw new Error(projectsErr.message);
      setProjects((projectsData ?? []) as ProjectOption[]);
      setViewers((viewersRes as { viewers: Viewer[] }).viewers ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("ProjectViewers load failed:", err);
      setLoadError(msg);
      toast.error(`Could not load project viewers: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCreating(true);
    try {
      await createViewer({
        data: {
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          full_name: String(fd.get("full_name")),
          phone: String(fd.get("phone") || ""),
          project_ids: selectedProjectIds,
        },
      });
      toast.success("Project viewer account created");
      (e.target as HTMLFormElement).reset();
      setSelectedProjectIds([]);
      await loadAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Could not create viewer: ${msg}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleAssignment(viewer: Viewer, project: ProjectOption, currentlyAssigned: boolean) {
    const key = `${viewer.id}:${project.id}`;
    setBusyAssignKey(key);
    try {
      if (currentlyAssigned) {
        await unassignProject({ data: { viewer_id: viewer.id, project_id: project.id } });
        toast.success(`Unassigned "${project.title}"`);
      } else {
        await assignProject({ data: { viewer_id: viewer.id, project_id: project.id } });
        toast.success(`Assigned "${project.title}"`);
      }
      await loadAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusyAssignKey(null);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Eye className="h-6 w-6" />
          Project Viewers
        </h1>
        <p className="text-muted-foreground mt-1">
          Create view-only accounts and assign which projects they can see. They get no
          approval or edit rights anywhere.
        </p>
      </div>

      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Create a project viewer
        </h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" required minLength={6} />
            </div>
          </div>

          <div>
            <Label>Projects they can view</Label>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border p-3 space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active projects found.</p>
              ) : (
                projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedProjectIds.includes(p.id)}
                      onCheckedChange={() => toggleProject(p.id)}
                    />
                    {p.title}
                  </label>
                ))
              )}
            </div>
          </div>

          <Button type="submit" disabled={creating}>
            {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create viewer account
          </Button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Existing viewers</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground mt-2">Loading…</p>
        ) : loadError ? (
          <p className="text-sm text-destructive mt-2">Failed to load: {loadError}</p>
        ) : viewers.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">No project viewers yet.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {viewers.map((v) => {
              const assignedIds = new Set(v.projects.map((p) => p.id));
              return (
                <li key={v.id} className="rounded-lg border bg-card p-4">
                  <div className="font-medium">{v.full_name || v.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.email} {v.phone && `· ${v.phone}`}
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Assigned projects
                    </div>
                    <div className="grid sm:grid-cols-2 gap-1">
                      {projects.map((p) => {
                        const assigned = assignedIds.has(p.id);
                        const key = `${v.id}:${p.id}`;
                        return (
                          <label key={p.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={assigned}
                              disabled={busyAssignKey === key}
                              onCheckedChange={() => handleToggleAssignment(v, p, assigned)}
                            />
                            {p.title}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
