import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/pdf";
import { FileDown, Pencil, Calendar, Trash2 } from "lucide-react";
import DeleteProjectDialog from "@/components/DeleteProjectDialog";
import { SERVICES, type ServiceKey } from "@/lib/services";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Row {
  id: string;
  jobNo: string;
  date: string;
  title: string;
  service: string;
  location: string;
  quotedAmt: number | null;
  paidByClient: number;
  amountDue: number | null;
  vendorName: string | null;
  vendorQuoted: number | null;
  variance: number | null;
  amountPayable: number | null;
  paidToVendor: number;
  dueToVendor: number | null;
  margin: number | null;
  marginPercent: number | null;
  workDoneDate: string | null;
  comment: string;
}

export default function WorkDataSheet() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editService, setEditService] = useState<ServiceKey | "">("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: projects } = await (supabase.from("projects") as any)
      .select(
        "id,job_number,title,service,location,status,created_at,updated_at,work_comment,quotations(id,grand_total,created_at)",
      )
      .eq("archived", false)
      .order("created_at", { ascending: false });

    const projectRows = (projects ?? []) as any[];

    const quotationIds = projectRows
      .flatMap((p) => (Array.isArray(p.quotations) ? p.quotations : []))
      .map((q: any) => q.id);

    const { data: invoices } = quotationIds.length
      ? await supabase.from("invoices").select("id,quotation_id,total").in("quotation_id", quotationIds)
      : { data: [] as any[] };

    const invoiceIds = (invoices ?? []).map((i: any) => i.id);
    const { data: allocations } = invoiceIds.length
      ? await supabase.from("payment_allocations").select("invoice_id,amount_applied").in("invoice_id", invoiceIds)
      : { data: [] as any[] };

    const paidByInvoice = (allocations ?? []).reduce<Record<string, number>>((map, a: any) => {
      map[a.invoice_id] = (map[a.invoice_id] ?? 0) + Number(a.amount_applied ?? 0);
      return map;
    }, {});

    const invoiceByQuotation = (invoices ?? []).reduce<Record<string, any>>((map, inv: any) => {
      map[inv.quotation_id] = inv;
      return map;
    }, {});

    const projectIds = projectRows.map((p) => p.id);
    const { data: vendorAssignments } = projectIds.length
      ? await supabase
          .from("project_vendor_assignments")
          .select("project_id,cost,amount_payable,amount_paid,status,created_at,vendors(name)")
          .in("project_id", projectIds)
      : { data: [] as any[] };

    const vendorByProject: Record<string, any> = {};
    for (const va of vendorAssignments ?? []) {
      const existing = vendorByProject[(va as any).project_id];
      if (!existing) {
        vendorByProject[(va as any).project_id] = va;
        continue;
      }
      const existingApproved = existing.status === "approved";
      const candidateApproved = (va as any).status === "approved";
      if (candidateApproved && !existingApproved) {
        vendorByProject[(va as any).project_id] = va;
      } else if (candidateApproved === existingApproved) {
        if (new Date((va as any).created_at).getTime() > new Date(existing.created_at).getTime()) {
          vendorByProject[(va as any).project_id] = va;
        }
      }
    }

    const built: Row[] = projectRows.map((p) => {
      const quotationsArr = Array.isArray(p.quotations) ? p.quotations : [];
      const latestQuotation = quotationsArr.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
      const quotedAmt = latestQuotation?.grand_total ?? null;
      const invoice = latestQuotation ? invoiceByQuotation[latestQuotation.id] : null;
      const paidByClient = invoice ? (paidByInvoice[invoice.id] ?? 0) : 0;
      const amountDue = quotedAmt != null ? Number((quotedAmt - paidByClient).toFixed(2)) : null;

      const va = vendorByProject[p.id];
      const vendorName = va?.vendors?.name ?? null;
      const vendorQuoted = va?.cost != null ? Number(va.cost) : null;
      const amountPayable = va?.amount_payable != null ? Number(va.amount_payable) : vendorQuoted;
      const paidToVendor = va?.amount_paid != null ? Number(va.amount_paid) : 0;
      const variance =
        amountPayable != null && vendorQuoted != null ? Number((amountPayable - vendorQuoted).toFixed(2)) : null;
      const dueToVendor = amountPayable != null ? Number((amountPayable - paidToVendor).toFixed(2)) : null;
      const margin = quotedAmt != null && amountPayable != null ? Number((quotedAmt - amountPayable).toFixed(2)) : null;
      const marginPercent = margin != null && amountPayable ? Number(((margin / amountPayable) * 100).toFixed(1)) : null;

      return {
        id: p.id,
        service: p.service,
        jobNo: p.job_number ?? "—",
        date: p.created_at,
        title: p.title,
        location: p.location ?? "—",
        quotedAmt,
        paidByClient,
        amountDue,
        vendorName,
        vendorQuoted,
        variance,
        amountPayable,
        paidToVendor,
        dueToVendor,
        margin,
        marginPercent,
        workDoneDate: p.status === "completed" ? p.updated_at : null,
        comment: p.work_comment ?? "",
      };
    });

    setRows(built);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveComment(id: string, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, comment: value } : r)));
    const { error } = await supabase.from("projects").update({ work_comment: value }).eq("id", id);
    if (error) toast.error(error.message);
  }

  function openEdit(r: Row) {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditService(r.service as ServiceKey);
  }

  async function saveEdit() {
    if (!editingId || !editTitle.trim() || !editService) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("projects")
      .update({ title: editTitle.trim(), service: editService })
      .eq("id", editingId);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    toast.success("Project updated");
    setEditingId(null);
    load();
  }

  async function scheduleProject(r: Row) {
    const startDate = window.prompt("Schedule start date (YYYY-MM-DD)", "");
    if (startDate === null) return;
    const endDate = window.prompt("Schedule end date (YYYY-MM-DD)", "");
    if (endDate === null) return;
    const { error } = await supabase
      .from("projects")
      .update({
        scheduled_date: startDate.trim() || null,
        scheduled_end_date: endDate.trim() || null,
        status: "scheduled",
      })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Schedule updated");
    load();
  }

  function exportCsv() {
    downloadCsv(
      `work-data-sheet-${Date.now()}.csv`,
      rows.map((r) => ({
        job_id: r.jobNo,
        date: r.date,
        project_name: r.title,
        location: r.location,
        quoted_amt: r.quotedAmt ?? "",
        amt_paid_by_client: r.paidByClient,
        amount_due: r.amountDue ?? "",
        vendor_name: r.vendorName ?? "",
        amount_quoted_by_vendor: r.vendorQuoted ?? "",
        variance: r.variance ?? "",
        amount_payable: r.amountPayable ?? "",
        amt_paid_to_vendor: r.paidToVendor,
        amount_due_to_vendor: r.dueToVendor ?? "",
        margin: r.margin ?? "",
        margin_percent: r.marginPercent != null ? `${r.marginPercent}%` : "",
        work_done_date: r.workDoneDate ?? "",
        comment: r.comment,
      })),
    );
  }

  const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold tracking-tight">Work Data Sheet</h2>
        <Button size="sm" variant="outline" onClick={exportCsv}>
          <FileDown className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wide">
              <th colSpan={5} className="p-2 text-center bg-violet-100 border">Project</th>
              <th colSpan={3} className="p-2 text-center bg-amber-100 border">Client</th>
              <th colSpan={5} className="p-2 text-center bg-pink-100 border">Vendor</th>
              <th colSpan={4} className="p-2 text-center bg-green-100 border">Work Done / Date</th>
            </tr>
            <tr className="text-left text-xs">
              <th className="p-2 border">No.</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Project ID</th>
              <th className="p-2 border">Project Name</th>
              <th className="p-2 border">Location</th>
              <th className="p-2 border text-right">Quoted Amt</th>
              <th className="p-2 border text-right">Amt Paid</th>
              <th className="p-2 border text-right">Amount Due</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border text-right">Amt Quoted</th>
              <th className="p-2 border text-right">Variance</th>
              <th className="p-2 border text-right">Amt Payable</th>
              <th className="p-2 border text-right">Amt Paid</th>
              <th className="p-2 border text-right">Amt Due</th>
              <th className="p-2 border text-right">Margin</th>
              <th className="p-2 border text-right">% Margin</th>
              <th className="p-2 border">Work Done/Date</th>
              <th className="p-2 border">Comment</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={19} className="p-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={19} className="p-6 text-center text-muted-foreground">No projects.</td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-2 border whitespace-nowrap">{r.jobNo}</td>
                  <td className="p-2 border">{r.title}</td>
                  <td className="p-2 border">{r.location}</td>
                  <td className="p-2 border text-right">{fmt(r.quotedAmt)}</td>
                  <td className="p-2 border text-right">{fmt(r.paidByClient)}</td>
                  <td className="p-2 border text-right bg-amber-50">{fmt(r.amountDue)}</td>
                  <td className="p-2 border">{r.vendorName ?? "—"}</td>
                  <td className="p-2 border text-right">{fmt(r.vendorQuoted)}</td>
                  <td className="p-2 border text-right">{fmt(r.variance)}</td>
                  <td className="p-2 border text-right">{fmt(r.amountPayable)}</td>
                  <td className="p-2 border text-right">{fmt(r.paidToVendor)}</td>
                  <td className="p-2 border text-right bg-pink-50">{fmt(r.dueToVendor)}</td>
                  <td className="p-2 border text-right">{fmt(r.margin)}</td>
                  <td className="p-2 border text-right">{r.marginPercent != null ? `${r.marginPercent}%` : "—"}</td>
                  <td className="p-2 border whitespace-nowrap">
                    {r.workDoneDate ? new Date(r.workDoneDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-2 border min-w-[160px]">
                    <Input
                      defaultValue={r.comment}
                      className="h-8 text-xs"
                      onBlur={(e) => {
                        if (e.target.value !== r.comment) saveComment(r.id, e.target.value);
                      }}
                    />
                  </td>
                  <td className="p-2 border">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => scheduleProject(r)}>
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <DeleteProjectDialog projectId={r.id} projectTitle={r.title} onDeleted={load}>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DeleteProjectDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Project title" />
            <select
              value={editService}
              onChange={(e) => setEditService(e.target.value as ServiceKey)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select service</option>
              {SERVICES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)} disabled={savingEdit}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
