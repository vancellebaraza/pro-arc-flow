import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, SERVICES, statusColorClasses } from "@/lib/services";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/project-viewer/")({
  component: ProjectViewerHome,
});

interface AssignedProject {
  id: string;
  title: string;
  service: string;
  status: string;
  location: string | null;
  created_at: string;
}

function ProjectViewerHome() {
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_view_admin_assignments")
        .select("project_id, projects(id,title,service,status,location,created_at)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const rows = (data ?? [])
        .map((row: any) => row.projects)
        .filter(Boolean) as AssignedProject[];
      setProjects(rows);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Assigned projects</h1>
        <p className="text-muted-foreground mt-1">
          View-only access to quotations and inspection reports.
        </p>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No projects assigned to you yet. Ask your mini-admin to assign one.
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {projects.map((p) => {
              const svc = SERVICES.find((s) => s.key === p.service);
              const colors = statusColorClasses(p.status);
              return (
                <li key={p.id}>
                  <Link
                    to="/project-viewer/$projectId"
                    params={{ projectId: p.id }}
                    className="relative flex items-center justify-between gap-4 overflow-hidden p-5 pl-6 hover:bg-accent/50 transition"
                  >
                    <div className={`absolute inset-y-0 left-0 w-[3px] ${colors.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {svc?.label ?? p.service}
                        </span>
                        <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs ${colors.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </div>
                      <div className="mt-1 font-medium truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Location: {p.location ?? "—"}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
