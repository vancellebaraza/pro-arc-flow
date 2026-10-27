import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusChip } from "@/components/ui/status-chip";
import { SERVICES, statusColorClasses } from "@/lib/services";
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

const NO_PROJECTS: Project[] = [];

function EngineerHome() {
  const [q, setQ] = useState("");

  // Cached list is shown straight away on return visits and always refreshed on mount.
  const { data: cachedProjects, isPending: loading } = useQuery<Project[]>({
    queryKey: ["engineer-projects"],
    staleTime: 30_000,
    refetchOnMount: "always",
    queryFn: async () => {
      try {
        const { data: projectRows } = await supabase
          .from("projects")
          .select("id,title,service,status,location,engineer_id,created_at,scheduled_date")
          .eq("archived", false)
          .order("created_at", { ascending: false });

        return (projectRows ?? []) as Project[];
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load engineer dashboard");
        return [];
      }
    },
  });
  const projects = cachedProjects ?? NO_PROJECTS;

  const filtered = projects.filter(
    (p) =>
      !q ||
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      (p.location ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Engineer dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
        <p className="text-sm text-muted-foreground mb-5">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground mb-5">
          No projects found.
        </div>
      ) : (
        <ul className="mb-5 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {filtered.map((p) => {
            const svc = SERVICES.find((s) => s.key === p.service);
            const colors = statusColorClasses(p.status);
            return (
              <li key={p.id}>
                <Link
                  to="/engineer/$projectId"
                  params={{ projectId: p.id }}
                  className="relative block h-full overflow-hidden rounded-xl border bg-card p-4 pl-5 md:p-5 md:pl-6 hover:border-foreground/40 hover:shadow-sm transition"
                >
                  <div className={`absolute inset-y-0 left-0 w-[3px] ${colors.dot}`} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {svc?.label ?? p.service}
                    </span>
                    <StatusChip status={p.status} />
                  </div>
                  <h3 className="mt-3 truncate text-base font-semibold">{p.title}</h3>
                  <p className="truncate text-sm text-muted-foreground">{p.location ?? "—"}</p>
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-[13px] text-muted-foreground">
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
