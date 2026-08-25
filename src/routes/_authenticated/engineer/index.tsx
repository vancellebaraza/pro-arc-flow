import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES, STATUS_LABEL, statusColorClasses } from "@/lib/services";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/engineer/")({
  component: EngineerHome,
});

interface Project {
  id: string;
  title: string;
  service: string;
  status: string;
  location: string | null;
  engineer_id: string | null;
  created_at: string;
  scheduled_date: string | null;
}

function EngineerHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: projectRows } = await supabase
        .from("projects")
        .select("id,title,service,status,location,engineer_id,created_at,scheduled_date")
        .eq("archived", false)
        .order("created_at", { ascending: false });

      setProjects((projectRows ?? []) as Project[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load engineer dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = projects.filter(
    (p) =>
      !q ||
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      (p.location ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Engineer dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Pick a project to open inspection, quotation, worksheet and more.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground mb-8">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground mb-8">
          No projects found.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {filtered.map((p) => {
            const svc = SERVICES.find((s) => s.key === p.service);
            const colors = statusColorClasses(p.status);
            return (
              <li key={p.id}>
                <Link
                  to="/engineer/$projectId"
                  params={{ projectId: p.id }}
                  className="relative block h-full overflow-hidden rounded-xl border bg-card p-5 pl-6 hover:border-foreground/40 hover:shadow-sm transition"
                >
                  <div className={`absolute inset-y-0 left-0 w-[3px] ${colors.dot}`} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {svc?.label ?? p.service}
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs ${colors.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                  <h3 className="mt-2 font-medium truncate">{p.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{p.location ?? "—"}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {p.scheduled_date ? `Scheduled ${p.scheduled_date}` : "Unscheduled"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
