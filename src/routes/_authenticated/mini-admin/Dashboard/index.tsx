
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ApproveEvidenceDialog from "@/components/ApproveEvidenceDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { STATUS_LABEL, SERVICES, type ServiceKey } from "@/lib/services";
import { downloadCsv } from "@/lib/pdf";
import { exportHistoricalProjectsPdf } from "@/lib/historicalProjects";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { FileDown, Check, Calendar, Trash2 } from "lucide-react";
import DeleteProjectDialog from "@/components/DeleteProjectDialog";

export const Route = createFileRoute("/_authenticated/mini-admin/Dashboard/")({
  component: AdminHome,
});

interface Row {
  id: string;
  title: string;
  service: string;
  status: string;
  location: string | null;
  client_id: string;
  client_name: string | null;
  engineer_id: string | null;
  engineer_name: string | null;
  scheduled_date: string | null;
  scheduled_end_date: string | null;
  created_at: string;
  job_number: string | null;
  quoted_amount: number | null;
  vendor_cost: number;
  payment_status: string | null;
}

interface PendingVendorAssignmentRow {
  id: string;
  project_id: string;
  project: { title: string };
  vendor: { name: string; category: string };
  created_at: string;
}

interface QuotationRow {
  project_id: string;
  grand_total: number;
  payment_status: string;
  created_at: string;
}

interface ProjectQueryRow {
  id: string;
  title: string;
  service: string;
  status: string;
  location: string | null;
  scheduled_date: string | null;
  scheduled_end_date: string | null;
  created_at: string;
  job_number: string | null;
  client_id: string;
  engineer_id: string | null;
  quotations?: QuotationRow[];
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

interface VendorCostRow {
  project_id: string;
  cost: number | null;
}

function formatScheduleDate(value: string | null) {
  if (!value) return "—";

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function renderScheduleDisplay(startDate: string | null, endDate: string | null) {
  const startLabel = formatScheduleDate(startDate);
  const endLabel = formatScheduleDate(endDate);

  if (startLabel === "—" && endLabel === "—") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <span>{startLabel === "—" ? "Start: —" : `Start: ${startLabel}`}</span>
      <span className="text-muted-foreground">
        {endLabel === "—" ? "End: —" : `End: ${endLabel}`}
      </span>
    </div>
  );
}

function AdminHome() {
  const [rows, setRows] = useState<Row[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState<
    Array<{
      id: string;
      project_id: string;
      grand_total: number;
      status: string;
      project: { title: string };
    }>
  >([]);
  const [pendingVendorAssignments, setPendingVendorAssignments] = useState<
    PendingVendorAssignmentRow[]
  >([]);
  const [filter, setFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState<"all" | "completed" | "not_completed">(
    "all",
  );
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "partial" | "unpaid">(
    "all",
  );
  const [canManage, setCanManage] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editService, setEditService] = useState<ServiceKey | "">("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    const { data } = await (supabase.from("projects") as any)
      .select(
        `id,title,service,status,location,scheduled_date,scheduled_end_date,created_at,job_number,client_id,engineer_id,quotations(project_id,grand_total,payment_status,created_at)`,
      )
      .eq("archived", false)
      .order("created_at", { ascending: false });

    const projectRows = (data ?? []) as ProjectQueryRow[];

    const profileIds = Array.from(
      new Set(
        projectRows.flatMap((row: ProjectQueryRow) =>
          [row.client_id, row.engineer_id].filter(Boolean),
        ),
      ),
    ) as string[];

    const { data: profiles } = profileIds.length
      ? await supabase.from("profiles").select("id,full_name").in("id", profileIds as string[])
      : { data: [] as ProfileRow[] };

    const profileMap = (profiles ?? []).reduce<Record<string, string>>((map, profile) => {
      map[(profile as ProfileRow).id] = (profile as ProfileRow).full_name ?? "";
      return map;
    }, {});

    const rowsWithAggregates = projectRows.map((row: ProjectQueryRow) => {
      const projectQuotations = Array.isArray(row.quotations) ? row.quotations : [];
      const latestQuotation = projectQuotations.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
      return {
        ...row,
        client_name: profileMap[row.client_id] ?? null,
        engineer_name: row.engineer_id ? profileMap[row.engineer_id] ?? null : null,
        quoted_amount: latestQuotation?.grand_total ?? null,
        payment_status: latestQuotation?.payment_status ?? null,
        vendor_cost: 0,
      } as Row;
    });

    const { data: vendorCosts } = await supabase
      .from("project_vendor_assignments")
      .select("project_id,cost");

    const vendorCostMap = (vendorCosts ?? []).reduce<Record<string, number>>(
      (map, assignment: VendorCostRow) => {
        map[assignment.project_id] =
          (map[assignment.project_id] ?? 0) + Number(assignment.cost ?? 0);
        return map;
      },
      {},
    );

    setRows(
      rowsWithAggregates.map((row) => ({
        ...row,
        vendor_cost: vendorCostMap[row.id] ?? 0,
      })),
    );

    const { data: q } = await supabase
      .from("quotations")
      .select("id,project_id,grand_total,status, project:projects(title)")
      .eq("status", "sent");
    setPendingQuotes(
      (q ?? []) as Array<{
        id: string;
        project_id: string;
        grand_total: number;
        status: string;
        project: { title: string };
      }>,
    );

    const { data: assignments, error: assignmentsError } = await supabase
      .from("project_vendor_assignments")
      .select(
        "id,project_id,status,created_at, project:projects(title), vendor:vendors(name, category)",
      )
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false });

    if (assignmentsError) {
      toast.error(assignmentsError.message);
    } else {
      setPendingVendorAssignments((assignments ?? []) as PendingVendorAssignmentRow[]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;

    async function loadRoles() {
      const { data: userData, error } = await supabase.auth.getUser();
      if (!mounted || error || !userData.user) return;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);

      if (!mounted || rolesError) return;

      const isManageRole = (rolesData ?? []).some(
        (role: { role: string }) => role.role === "admin" || role.role === "mini_admin",
      );
      setCanManage(isManageRole);
    }

    loadRoles();
    return () => {
      mounted = false;
    };
  }, []);

  async function approveQuote(qid: string, pid: string) {
    await supabase.from("quotations").update({ status: "approved" }).eq("id", qid);
    await supabase.from("projects").update({ status: "approved" }).eq("id", pid);
    toast.success("Quotation approved");
    load();
  }

  function openEditDialog(project: Row) {
    setEditingProjectId(project.id);
    setEditTitle(project.title);
    setEditService(project.service as ServiceKey);
  }

  async function saveProjectEdit() {
    if (!editingProjectId || !editTitle.trim() || !editService) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ title: editTitle.trim(), service: editService })
        .eq("id", editingProjectId);

      if (error) throw error;

      setRows((current) =>
        current.map((row) =>
          row.id === editingProjectId
            ? { ...row, title: editTitle.trim(), service: editService }
            : row,
        ),
      );
      setEditingProjectId(null);
      setEditTitle("");
      setEditService("");
      toast.success("Project updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update project");
    } finally {
      setSavingEdit(false);
    }
  }

  function handleDeleted(projectId: string) {
    setRows((current) => current.filter((row) => row.id !== projectId));
  }

  async function schedule(p: Row) {
    const startDate = window.prompt("Schedule start date (YYYY-MM-DD)", p.scheduled_date ?? "");
    if (startDate === null) return;

    const endDate = window.prompt("Schedule end date (YYYY-MM-DD)", p.scheduled_end_date ?? "");
    if (endDate === null) return;

    await (supabase.from("projects") as any)
      .update({
        scheduled_date: startDate.trim() || null,
        scheduled_end_date: endDate.trim() || null,
        status: "scheduled",
      })
      .eq("id", p.id);
    toast.success("Schedule updated");
    load();
  }

  async function updateVendorAssignmentStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("project_vendor_assignments")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Vendor assignment ${status}`);
    load();
  }

  function exportSheet() {
    const data = rows.map((r) => ({
      id: r.id.slice(0, 8),
      job_number: r.job_number ?? "",
      title: r.title,
      client_name: r.client_name ?? "",
      engineer_name: r.engineer_name ?? "",
      service: r.service,
      status: r.status,
      payment_status: r.payment_status ?? "",
      quoted_amount: r.quoted_amount ?? 0,
      vendor_cost: r.vendor_cost,
      gross_margin_amount:
        r.quoted_amount != null ? Number((r.quoted_amount - r.vendor_cost).toFixed(2)) : 0,
      gross_margin_percent: r.quoted_amount
        ? Number((((r.quoted_amount - r.vendor_cost) / r.quoted_amount) * 100).toFixed(1))
        : "—",
      location: r.location ?? "",
      scheduled_date: r.scheduled_date ?? "",
      scheduled_end_date: r.scheduled_end_date ?? "",
      created_at: r.created_at,
    }));
    downloadCsv(`fusionpro-work-data-sheet-${Date.now()}.csv`, data);
  }

  function exportPdf() {
    const doc = new jsPDF();
    const date = new Date().toISOString().slice(0, 10);
    doc.setFontSize(16);
    doc.text("FusionPro Work Data Sheet", 14, 20);
    doc.setFontSize(9);
    doc.text(`Export date: ${date}`, 14, 26);

    autoTable(doc, {
      startY: 34,
      head: [
        [
          "Job #",
          "Title",
          "Client",
          "Engineer",
          "Service",
          "Status",
          "Payment",
          "Quoted",
          "Vendor Cost",
          "Gross %",
          "Completion",
          "Scheduled",
        ],
      ],
      body: filtered.map((r) => [
        r.job_number ?? "—",
        r.title,
        r.client_name ?? "—",
        r.engineer_name ?? "—",
        SERVICES.find((s) => s.key === r.service)?.label ?? r.service,
        STATUS_LABEL[r.status] ?? r.status,
        r.payment_status ?? "unpaid",
        r.quoted_amount != null ? r.quoted_amount.toFixed(2) : "—",
        r.vendor_cost.toFixed(2),
        r.quoted_amount
          ? `${(((r.quoted_amount - r.vendor_cost) / r.quoted_amount) * 100).toFixed(1)}%`
          : "—",
        STATUS_LABEL[r.status] ?? r.status,
        [r.scheduled_date, r.scheduled_end_date]
          .filter((value) => value)
          .join(" – ") || "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: { 7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" } },
      theme: "striped",
      margin: { left: 14, right: 14 },
    });

    doc.save(`fusionpro-work-data-sheet-${date}.pdf`);
  }

  const filtered = rows.filter((r) => {
    const normalizedFilter = filter.trim().toLowerCase();
    const matchesText =
      !normalizedFilter ||
      r.title.toLowerCase().includes(normalizedFilter) ||
      r.service.toLowerCase().includes(normalizedFilter) ||
      (r.job_number ?? "").toLowerCase().includes(normalizedFilter) ||
      (r.client_name ?? "").toLowerCase().includes(normalizedFilter) ||
      (r.engineer_name ?? "").toLowerCase().includes(normalizedFilter) ||
      (r.payment_status ?? "").toLowerCase().includes(normalizedFilter) ||
      (r.location ?? "").toLowerCase().includes(normalizedFilter) ||
      (r.scheduled_date ?? "").toLowerCase().includes(normalizedFilter) ||
      (r.scheduled_end_date ?? "").toLowerCase().includes(normalizedFilter) ||
      String(r.quoted_amount ?? "").includes(normalizedFilter) ||
      String(r.vendor_cost).includes(normalizedFilter);

    const matchesService = serviceFilter === "all" || r.service === serviceFilter;
    const matchesCompletion =
      completionFilter === "all" ||
      (completionFilter === "completed" ? r.status === "completed" : r.status !== "completed");
    const matchesPayment =
      paymentFilter === "all" || (r.payment_status ?? "unpaid").toLowerCase() === paymentFilter;

    return matchesText && matchesService && matchesCompletion && matchesPayment;
  });

  return (
    <div className="p-4 md:p-8 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin overview</h1>
          <p className="text-muted-foreground mt-1">
            Approve quotations, manage vendors, schedule work, export reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/mini-admin/Admin/vendors">Vendor management</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/mini-admin">Staff To Do List</Link>
          </Button>
          <Button variant="outline" onClick={exportSheet}>
            <FileDown className="h-4 w-4 mr-1" />
            Export Work Data Sheet (CSV)
          </Button>
          <Button variant="outline" onClick={exportPdf}>
            <FileDown className="h-4 w-4 mr-1" />
            Export Work Data Sheet (PDF)
          </Button>
          <Button variant="outline" onClick={exportHistoricalProjectsPdf}>
            <FileDown className="h-4 w-4 mr-1" />
            Export Historical Projects (PDF)
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(editingProjectId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProjectId(null);
            setEditTitle("");
            setEditService("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>Update the project title and service.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Project title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Service</label>
              <select
                value={editService}
                onChange={(event) => setEditService(event.target.value as ServiceKey)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {SERVICES.map((service) => (
                  <option key={service.key} value={service.key}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingProjectId(null)}>
              Cancel
            </Button>
            <Button onClick={saveProjectEdit} disabled={savingEdit || !editTitle.trim()}>
              {savingEdit ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {[
          { label: "Total projects", value: rows.length },
          {
            label: "In progress",
            value: rows.filter((r) => r.status === "in_progress" || r.status === "scheduled")
              .length,
          },
          { label: "Pending quotes", value: pendingQuotes.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      {pendingQuotes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Quotations pending approval</h2>
          <ul className="mt-3 rounded-xl border bg-card divide-y">
            {pendingQuotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{q.project?.title ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">
                    Total: {Number(q.grand_total).toFixed(2)}
                  </div>
                </div>
                <ApproveEvidenceDialog quotationId={q.id} projectId={q.project_id} onApproved={load} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {pendingVendorAssignments.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Vendor assignments pending approval
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review vendor requests submitted by engineers.
              </p>
            </div>
            <Link
              to="/admin/vendors"
              className="text-sm text-primary underline hover:text-primary/80"
            >
              Manage vendors
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVendorAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.project?.title ?? "—"}</TableCell>
                    <TableCell>{assignment.vendor?.name ?? "—"}</TableCell>
                    <TableCell>{assignment.vendor?.category ?? "—"}</TableCell>
                    <TableCell>{new Date(assignment.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right gap-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVendorAssignmentStatus(assignment.id, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateVendorAssignmentStatus(assignment.id, "approved")}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Work Data Sheet</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Service</label>
              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All services</option>
                {SERVICES.map((service) => (
                  <option key={service.key} value={service.key}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Completion Status</label>
              <select
                value={completionFilter}
                onChange={(event) =>
                  setCompletionFilter(event.target.value as "all" | "completed" | "not_completed")
                }
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="not_completed">Not completed</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(event.target.value as "all" | "paid" | "partial" | "unpaid")
                }
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <Input
              placeholder="Search…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3">Job #</th>
                <th className="p-3">Title</th>
                <th className="p-3">Client</th>
                <th className="p-3">Engineer</th>
                <th className="p-3">Service</th>
                <th className="p-3">Quoted Amount</th>
                <th className="p-3">Vendor Cost</th>
                <th className="p-3">Gross Margin</th>
                <th className="p-3">Gross %</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3">Completion Status</th>
                <th className="p-3">Location</th>
                <th className="p-3">Scheduled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const grossAmount =
                  r.quoted_amount != null ? r.quoted_amount - r.vendor_cost : null;
                const grossPercent = r.quoted_amount
                  ? `${(((r.quoted_amount - r.vendor_cost) / r.quoted_amount) * 100).toFixed(1)}%`
                  : "—";
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-medium">{r.job_number ?? "—"}</td>
                    <td className="p-3 font-medium">{r.title}</td>
                    <td className="p-3">{r.client_name ?? "—"}</td>
                    <td className="p-3">{r.engineer_name ?? "—"}</td>
                    <td className="p-3">
                      {SERVICES.find((s) => s.key === r.service)?.label ?? r.service}
                    </td>
                    <td className="p-3">
                      {r.quoted_amount != null ? r.quoted_amount.toFixed(2) : "—"}
                    </td>
                    <td className="p-3">{r.vendor_cost.toFixed(2)}</td>
                    <td className="p-3">{grossAmount != null ? grossAmount.toFixed(2) : "—"}</td>
                    <td className="p-3">{grossPercent}</td>
                    <td className="p-3">{r.payment_status ?? "unpaid"}</td>
                    <td className="p-3">{STATUS_LABEL[r.status] ?? r.status}</td>
                    <td className="p-3 text-muted-foreground">{r.location ?? "—"}</td>
                    <td className="p-3">{renderScheduleDisplay(r.scheduled_date, r.scheduled_end_date)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && (
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(r)}>
                            Edit
                          </Button>
                        )}
                        <DeleteProjectDialog
                          projectId={r.id}
                          projectTitle={r.title}
                          onDeleted={() => handleDeleted(r.id)}
                        >
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteProjectDialog>
                        <Button size="sm" variant="ghost" onClick={() => schedule(r)}>
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="p-6 text-center text-sm text-muted-foreground">
                    No projects.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
