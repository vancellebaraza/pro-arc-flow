
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { STATUS_LABEL, SERVICES } from "@/lib/services";
import { downloadCsv } from "@/lib/pdf";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { FileDown, Check, Calendar } from "lucide-react";

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

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select(
        `id,title,service,status,location,scheduled_date,created_at,job_number,client_id,engineer_id,quotations(project_id,grand_total,payment_status,created_at)`,
      )
      .order("created_at", { ascending: false });

    const profileIds = Array.from(
      new Set(
        (data ?? []).flatMap((row: ProjectQueryRow) =>
          [row.client_id, row.engineer_id].filter(Boolean),
        ),
      ),
    ) as string[];

    const { data: profiles } = profileIds.length
      ? await supabase.from<ProfileRow>("profiles").select("id,full_name").in("id", profileIds)
      : { data: [] as ProfileRow[] };

    const profileMap = (profiles ?? []).reduce<Record<string, string>>((map, profile) => {
      map[profile.id] = profile.full_name ?? "";
      return map;
    }, {});

    const rowsWithAggregates = (data ?? []).map((row: ProjectQueryRow) => {
      const projectQuotations = Array.isArray(row.quotations) ? row.quotations : [];
      const latestQuotation = projectQuotations.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
      return {
        ...row,
        client_name: profileMap[row.client_id] ?? null,
        engineer_name: profileMap[row.engineer_id] ?? null,
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

  async function approveQuote(qid: string, pid: string) {
    await supabase.from("quotations").update({ status: "approved" }).eq("id", qid);
    await supabase.from("projects").update({ status: "approved" }).eq("id", pid);
    toast.success("Quotation approved");
    load();
  }

  async function schedule(p: Row) {
    const date = prompt("Schedule date (YYYY-MM-DD)", p.scheduled_date ?? "");
    if (!date) return;
    await supabase
      .from("projects")
      .update({ scheduled_date: date, status: "scheduled" })
      .eq("id", p.id);
    toast.success("Scheduled");
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
        r.scheduled_date ?? "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: { 7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" } },
      theme: "striped",
      margin: { left: 14, right: 14 },
    });

    doc.save(`fusionpro-work-data-sheet-${date}.pdf`);
  }

  const filtered = rows.filter(
    (r) =>
      !filter ||
      r.title.toLowerCase().includes(filter.toLowerCase()) ||
      r.service.includes(filter.toLowerCase()) ||
      (r.job_number ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      (r.client_name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      (r.engineer_name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      (r.payment_status ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      (r.location ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      (r.scheduled_date ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      String(r.quoted_amount ?? "").includes(filter.toLowerCase()) ||
      String(r.vendor_cost).includes(filter.toLowerCase()),
  );

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
            <Link to="/mini-admin/Admin">Vendor management</Link>
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
        </div>
      </div>

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
                <Button size="sm" onClick={() => approveQuote(q.id, q.project_id)}>
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
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
          <Input
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
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
                    <td className="p-3">{r.scheduled_date ?? "—"}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => schedule(r)}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
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
