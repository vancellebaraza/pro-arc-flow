import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/invoices")({
  component: InvoicesPage,
});

interface ApprovableQuotation {
  id: string;
  project_id: string;
  project_title: string;
  client_id: string;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  issue_date: string;
  due_date: string | null;
  quotation_id: string;
}

function InvoicesPage() {
  const [availableQuotations, setAvailableQuotations] = useState<ApprovableQuotation[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<ApprovableQuotation | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: existingInvoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id,invoice_number,status,total,issue_date,due_date,quotation_id")
      .order("created_at", { ascending: false });

    if (invoicesError) {
      toast.error(invoicesError.message);
      setLoading(false);
      return;
    }

    setInvoices(existingInvoices ?? []);

    const invoicedQuotationIds = new Set((existingInvoices ?? []).map((inv) => inv.quotation_id));

    const { data: quotations, error: quotationsError } = await supabase
      .from("quotations")
      .select("id,project_id,client_id,subtotal,vat_amount,grand_total,projects(title)")
      .eq("status", "approved");

    if (quotationsError) {
      toast.error(quotationsError.message);
      setLoading(false);
      return;
    }

    const mapped = (quotations ?? [])
      .filter((q) => !invoicedQuotationIds.has(q.id))
      .map((q) => ({
        id: q.id,
        project_id: q.project_id,
        project_title: (q.projects as unknown as { title: string } | null)?.title ?? "Untitled project",
        client_id: q.client_id,
        subtotal: Number(q.subtotal) || 0,
        vat_amount: Number(q.vat_amount) || 0,
        grand_total: Number(q.grand_total) || 0,
      }));

    setAvailableQuotations(mapped);
    setLoading(false);
  }

  function openCreateDialog(quotation: ApprovableQuotation) {
    setCreating(quotation);
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setDueDate("");
  }

  async function handleCreateInvoice() {
    if (!creating) return;
    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          quotation_id: creating.id,
          client_id: creating.client_id,
          invoice_number: invoiceNumber.trim(),
          due_date: dueDate || null,
          status: "draft",
          subtotal: creating.subtotal,
          vat_amount: creating.vat_amount,
          total: creating.grand_total,
          created_by: userData.user?.id ?? null,
        })
        .select("id")
        .single();

      if (invoiceError || !invoiceData?.id) {
        throw invoiceError ?? new Error("Could not create invoice.");
      }

      const { data: quotationItems, error: itemsError } = await supabase
        .from("quotation_items")
        .select("description,unit,qty,unit_cost,amount,sort_order")
        .eq("quotation_id", creating.id)
        .order("sort_order");

      if (itemsError) {
        throw itemsError;
      }

      if (quotationItems && quotationItems.length > 0) {
        const lines = quotationItems.map((item) => ({
          invoice_id: invoiceData.id,
          description: item.description,
          unit: item.unit,
          qty: item.qty,
          unit_cost: item.unit_cost,
          amount: item.amount,
          sort_order: item.sort_order,
        }));

        const { error: linesError } = await supabase.from("invoice_lines").insert(lines);
        if (linesError) {
          throw linesError;
        }
      }

      toast.success("Invoice created as draft.");
      setCreating(null);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendInvoice(invoiceId: string) {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Invoice sent and posted to the ledger.");
    await loadData();
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create invoices from approved quotations. A draft invoice does not affect the ledger —
          only sending it does.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved quotations ready to invoice</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : availableQuotations.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No approved quotations are waiting to be invoiced.
            </div>
          ) : (
            <div className="space-y-2">
              {availableQuotations.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium">{q.project_title}</div>
                    <div className="text-sm text-muted-foreground">
                      Total: {q.grand_total.toFixed(2)}
                    </div>
                  </div>
                  <Button onClick={() => openCreateDialog(q)}>Create invoice</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : invoices.length === 0 ? (
            <div className="text-sm text-muted-foreground">No invoices yet.</div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium">{inv.invoice_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {inv.status} • Total: {Number(inv.total).toFixed(2)} • Issued{" "}
                      {new Date(inv.issue_date).toLocaleDateString()}
                    </div>
                  </div>
                  {inv.status === "draft" ? (
                    <Button variant="outline" onClick={() => handleSendInvoice(inv.id)}>
                      Send invoice
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground capitalize">{inv.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={creating !== null} onOpenChange={(open) => !open && setCreating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>
              {creating?.project_title} — total {creating?.grand_total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateInvoice} disabled={saving} className="w-full">
              {saving ? "Creating…" : "Create as draft"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}