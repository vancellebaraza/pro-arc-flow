
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SERVICES, STATUS_LABEL } from "@/lib/services";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/mini-admin/Admin/analysis")({
  component: AdminAnalysisPage,
});

interface QuotationRow {
  project_id: string;
  grand_total: number;
  payment_status: string | null;
  status: string;
  created_at: string;
}

interface ProjectRow {
  id: string;
  title: string;
  service: string;
  status: string;
  created_at: string;
  scheduled_date: string | null;
  location: string | null;
  quotations?: QuotationRow[];
}

interface VendorAssignmentRow {
  project_id: string;
  cost: number | null;
  status: string | null;
}

interface EnrichedProject extends ProjectRow {
  quotedAmount: number;
  paymentStatus: string | null;
  vendorCost: number;
}

function money(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function monthKey(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(new Date(date));
}

function shortDate(date: Date | string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function differenceInDays(start: Date, end: Date) {
  const day = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / day));
}

function statusProgress(status: string) {
  const progress: Record<string, number> = {
    requested: 10,
    inspected: 25,
    quoted: 40,
    approved: 55,
    scheduled: 65,
    in_progress: 80,
    completed: 100,
    rejected: 100,
  };

  return progress[status] ?? 20;
}

function AdminAnalysisPage() {
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(
        "id,title,service,status,created_at,scheduled_date,location,quotations(project_id,grand_total,payment_status,status,created_at)",
      )
      .order("created_at", { ascending: false });

    if (projectError) {
      toast.error(projectError.message);
      setLoading(false);
      return;
    }

    const { data: assignmentData, error: assignmentError } = await (supabase as any)
      .from("project_vendor_assignments")
      .select("project_id,cost,status");

    if (assignmentError) {
      toast.error(assignmentError.message);
    }

    const vendorCostByProject = ((assignmentData ?? []) as VendorAssignmentRow[]).reduce<
      Record<string, number>
    >((map, assignment) => {
      if (assignment.status === "rejected") return map;
      map[assignment.project_id] = (map[assignment.project_id] ?? 0) + Number(assignment.cost ?? 0);
      return map;
    }, {});

    const enriched = ((projectData ?? []) as ProjectRow[]).map((project) => {
      const latestQuote = [...(project.quotations ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      return {
        ...project,
        quotedAmount: Number(latestQuote?.grand_total ?? 0),
        paymentStatus: latestQuote?.payment_status ?? null,
        vendorCost: vendorCostByProject[project.id] ?? 0,
      };
    });

    setProjects(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const analysis = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter((project) => project.status === "completed").length;
    const activeProjects = projects.filter((project) =>
      ["approved", "scheduled", "in_progress"].includes(project.status),
    ).length;
    const totalQuoted = projects.reduce((sum, project) => sum + project.quotedAmount, 0);
    const totalVendorCost = projects.reduce((sum, project) => sum + project.vendorCost, 0);
    const grossMargin = totalQuoted - totalVendorCost;
    const marginRate = totalQuoted > 0 ? (grossMargin / totalQuoted) * 100 : 0;
    const averageQuote = totalProjects > 0 ? totalQuoted / totalProjects : 0;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const scheduledProjects = projects.filter((project) => project.scheduled_date).length;
    const paidQuoted = projects
      .filter((project) => project.paymentStatus === "paid")
      .reduce((sum, project) => sum + project.quotedAmount, 0);
    const outstandingQuoted = Math.max(totalQuoted - paidQuoted, 0);

    const statusCounts = Object.entries(
      projects.reduce<Record<string, number>>((map, project) => {
        map[project.status] = (map[project.status] ?? 0) + 1;
        return map;
      }, {}),
    ).sort((a, b) => b[1] - a[1]);

    const serviceBreakdown = SERVICES.map((service) => {
      const serviceProjects = projects.filter((project) => project.service === service.key);
      const quoted = serviceProjects.reduce((sum, project) => sum + project.quotedAmount, 0);
      const cost = serviceProjects.reduce((sum, project) => sum + project.vendorCost, 0);

      return {
        label: service.label,
        count: serviceProjects.length,
        quoted,
        cost,
        margin: quoted - cost,
      };
    }).filter((service) => service.count > 0);

    const topLocations = Object.entries(
       projects.reduce<Record<string, number>>((map, project) => {
       const location = project.location?.trim();

       if (!location) return map;

       map[location] = (map[location] ?? 0) + 1;

      return map;
     }, {})
    )
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

    const recentMonths = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return monthKey(date.toISOString());
    });
    const monthCounts = recentMonths.map((label) => ({
      label,
      count: projects.filter((project) => monthKey(project.created_at) === label).length,
    }));

    const topProjects = [...projects]
      .filter((project) => project.quotedAmount > 0)
      .sort((a, b) => b.quotedAmount - a.quotedAmount)
      .slice(0, 5);

    const timelineProjects = projects
      .filter((project) => project.status !== "rejected")
      .slice(0, 12)
      .map((project) => {
        const start = new Date(project.created_at);
        const scheduled = project.scheduled_date ? new Date(project.scheduled_date) : null;
        const end = scheduled && scheduled > start ? scheduled : addDays(start, 14);

        return {
          ...project,
          timelineStart: start,
          timelineEnd: end,
          progress: statusProgress(project.status),
        };
      });

    const serviceTimelines = SERVICES.map((service) => {
      const serviceProjects = timelineProjects.filter((project) => project.service === service.key);
      if (serviceProjects.length === 0) return null;

      return {
        key: service.key,
        label: service.label,
        timelineStart: new Date(
          Math.min(...serviceProjects.map((project) => project.timelineStart.getTime())),
        ),
        timelineEnd: new Date(
          Math.max(...serviceProjects.map((project) => project.timelineEnd.getTime())),
        ),
        count: serviceProjects.length,
      };
    }).filter(Boolean) as Array<{
      key: string;
      label: string;
      timelineStart: Date;
      timelineEnd: Date;
      count: number;
    }>;

    const timelineDates = [...timelineProjects, ...serviceTimelines].flatMap((item) => [
      item.timelineStart,
      item.timelineEnd,
    ]);
    const timelineStart =
      timelineDates.length > 0
        ? new Date(Math.min(...timelineDates.map((date) => date.getTime())))
        : new Date();
    const timelineEnd =
      timelineDates.length > 0
        ? new Date(Math.max(...timelineDates.map((date) => date.getTime())))
        : addDays(new Date(), 30);
    const timelineDays = differenceInDays(timelineStart, timelineEnd);

    const ganttTicks = Array.from({ length: 5 }, (_, index) => {
      const offset = Math.round((timelineDays / 4) * index);
      return addDays(timelineStart, offset);
    });

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      totalQuoted,
      totalVendorCost,
      grossMargin,
      marginRate,
      averageQuote,
      completionRate,
      scheduledProjects,
      paidQuoted,
      outstandingQuoted,
      statusCounts,
      serviceBreakdown,
      monthCounts,
      topProjects,
      timelineProjects,
      serviceTimelines,
      timelineStart,
      timelineDays,
      ganttTicks,
      topLocations
    };
  }, [projects]);

  const maxMonthCount = Math.max(1, ...analysis.monthCounts.map((month) => month.count));
  const maxStatusCount = Math.max(1, ...analysis.statusCounts.map(([, count]) => count));
  const maxLocationCount = Math.max(
    1,
    ...analysis.topLocations.map(([, count]) => count)
  );

  return (
    <div className="p-4 md:p-8 fade-in max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Track operational volume, revenue, vendor costs, and service performance.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Admin dashboard
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total projects", value: analysis.totalProjects, icon: BarChart3 },
          { label: "Active projects", value: analysis.activeProjects, icon: Clock3 },
          { label: "Completed", value: analysis.completedProjects, icon: CheckCircle2 },
          { label: "Paid quotations", value: money(analysis.paidQuoted), icon: Wallet },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </div>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{loading ? "..." : metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Quoted value", value: money(analysis.totalQuoted), icon: CircleDollarSign },
          {
            label: "Vendor costs",
            value: money(analysis.totalVendorCost),
            icon: BriefcaseBusiness,
          },
          { label: "Gross margin", value: money(analysis.grossMargin), icon: TrendingUp },
          { label: "Margin rate", value: `${analysis.marginRate.toFixed(1)}%`, icon: Percent },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-semibold">{loading ? "..." : metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          { label: "Average quote", value: money(analysis.averageQuote) },
          { label: "Outstanding quoted", value: money(analysis.outstandingQuoted) },
          { label: "Completion rate", value: `${analysis.completionRate.toFixed(1)}%` },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-card p-5">
            <div className="text-sm text-muted-foreground">{metric.label}</div>
            <div className="mt-1 text-2xl font-semibold">{loading ? "..." : metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-tight">Project status</h2>
          <div className="mt-5 space-y-4">
            {analysis.statusCounts.length === 0 && (
              <div className="text-sm text-muted-foreground">No project data available.</div>
            )}
            {analysis.statusCounts.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{STATUS_LABEL[status] ?? status}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8 rounded-lg border bg-card p-5">
  <div className="flex items-center gap-2">
    <BarChart3 className="h-5 w-5 text-muted-foreground" />
    <h2 className="text-lg font-semibold">
      Top 10 Most Visited Work Locations
    </h2>
  </div>

  <div className="mt-6 space-y-4">
    {analysis.topLocations.length === 0 ? (
      <div className="text-sm text-muted-foreground">
        No work locations available.
      </div>
    ) : (
      analysis.topLocations.map(([location, count]) => (
        <div key={location}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate">{location}</span>
            <span className="font-medium">
              {count} {count === 1 ? "visit" : "visits"}
            </span>
          </div>

          <div className="h-5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${(count / maxLocationCount) * 100}%`,
              }}
            />
          </div>
        </div>
      ))
    )}
  </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-tight">New projects by month</h2>
          <div className="mt-6 flex h-56 items-end gap-3">
            {analysis.monthCounts.map((month) => (
              <div key={month.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="text-xs font-medium">{month.count}</div>
                <div className="flex h-40 w-full items-end rounded bg-muted">
                  <div
                    className="w-full rounded bg-primary"
                    style={{ height: `${Math.max(5, (month.count / maxMonthCount) * 100)}%` }}
                  />
                </div>
                <div className="w-full truncate text-center text-xs text-muted-foreground">
                  {month.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Project Gantt chart</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Latest active project timelines from request date to scheduled or planning date.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Scheduled: {analysis.scheduledProjects}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[220px_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground">
              <div>Project</div>
              <div className="grid grid-cols-5">
                {analysis.ganttTicks.map((tick) => (
                  <div key={tick.toISOString()}>{shortDate(tick)}</div>
                ))}
              </div>
            </div>

            <div className="divide-y">
              {analysis.timelineProjects.map((project) => {
                const offset =
                  (differenceInDays(analysis.timelineStart, project.timelineStart) /
                    analysis.timelineDays) *
                  100;
                const width =
                  (differenceInDays(project.timelineStart, project.timelineEnd) /
                    analysis.timelineDays) *
                  100;

                return (
                  <div key={project.id} className="grid grid-cols-[220px_1fr] gap-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{project.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {STATUS_LABEL[project.status] ?? project.status}
                      </div>
                    </div>
                    <div className="relative h-9 rounded bg-muted">
                      <div className="absolute inset-y-0 left-0 right-0 grid grid-cols-5">
                        {analysis.ganttTicks.map((tick) => (
                          <div key={tick.toISOString()} className="border-l border-background/80" />
                        ))}
                      </div>
                      <div
                        className="absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded bg-primary/25 ring-1 ring-primary/30"
                        style={{
                          left: `${Math.min(Math.max(offset, 0), 96)}%`,
                          width: `${Math.max(4, Math.min(width, 100 - offset))}%`,
                        }}
                      >
                        <div
                          className="h-full rounded bg-primary"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {analysis.timelineProjects.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No active project timelines available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Service Gantt chart</h2>
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[220px_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground">
              <div>Service</div>
              <div className="grid grid-cols-5">
                {analysis.ganttTicks.map((tick) => (
                  <div key={tick.toISOString()}>{shortDate(tick)}</div>
                ))}
              </div>
            </div>

            <div className="divide-y">
              {analysis.serviceTimelines.map((service) => {
                const offset =
                  (differenceInDays(analysis.timelineStart, service.timelineStart) /
                    analysis.timelineDays) *
                  100;
                const width =
                  (differenceInDays(service.timelineStart, service.timelineEnd) /
                    analysis.timelineDays) *
                  100;

                return (
                  <div key={service.key} className="grid grid-cols-[220px_1fr] gap-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{service.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.count} project{service.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="relative h-9 rounded bg-muted">
                      <div className="absolute inset-y-0 left-0 right-0 grid grid-cols-5">
                        {analysis.ganttTicks.map((tick) => (
                          <div key={tick.toISOString()} className="border-l border-background/80" />
                        ))}
                      </div>
                      <div
                        className="absolute top-1/2 h-5 -translate-y-1/2 rounded bg-emerald-600"
                        style={{
                          left: `${Math.min(Math.max(offset, 0), 96)}%`,
                          width: `${Math.max(4, Math.min(width, 100 - offset))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {analysis.serviceTimelines.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No service timelines available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Service performance</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead className="text-right">Vendor Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.serviceBreakdown.map((service) => (
                <TableRow key={service.label}>
                  <TableCell className="font-medium">{service.label}</TableCell>
                  <TableCell>{service.count}</TableCell>
                  <TableCell className="text-right">{money(service.quoted)}</TableCell>
                  <TableCell className="text-right">{money(service.cost)}</TableCell>
                  <TableCell className="text-right">{money(service.margin)}</TableCell>
                </TableRow>
              ))}
              {analysis.serviceBreakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No service data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Highest quoted projects</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.topProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{STATUS_LABEL[project.status] ?? project.status}</TableCell>
                  <TableCell>
                    {SERVICES.find((service) => service.key === project.service)?.label ??
                      project.service}
                  </TableCell>
                  <TableCell className="text-right">{money(project.quotedAmount)}</TableCell>
                  <TableCell className="text-right">
                    {money(project.quotedAmount - project.vendorCost)}
                  </TableCell>
                </TableRow>
              ))}
              {analysis.topProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No quoted projects available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
