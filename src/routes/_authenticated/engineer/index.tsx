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
          <h1 className="font-display text-[1.75rem] font-bold leading-tight">Engineer dashboard</h1>
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
        <ul className="mb-5 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))]">
          {filtered.map((p) => {
            const svc = SERVICES.find((s) => s.key === p.service);
            const colors = statusColorClasses(p.status);
            return (
              <li key={p.id}>
                <Link
                  to="/engineer/$projectId"
                  params={{ projectId: p.id }}
                  className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 pl-6 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[var(--shadow-raised-hover)] active:scale-[0.98] motion-reduce:transform-none md:p-6 md:pl-7"
                >
                  <div className={`absolute inset-y-0 left-0 w-[3px] ${colors.dot}`} />
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className="shrink-0 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
                      {svc?.label ?? p.service}
                    </span>
                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                      <StatusChip status={p.status} />
                    </div>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{p.location ?? "—"}</p>
                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                      <span>
                        {p.scheduled_date ? `Scheduled ${p.scheduled_date}` : "Unscheduled"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
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
