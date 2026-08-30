import { createFileRoute } from "@tanstack/react-router";
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
import { logAudit } from "@/lib/auditLog";

export const Route = createFileRoute("/_authenticated/accountant/payments")({
  component: PaymentsPage,
});

interface OpenInvoice {
  id: string;
  invoice_number: string;
  total: number;
  client_id: string;
  paid_so_far: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string | null;
  received_date: string;
  reference: string | null;
}

function PaymentsPage() {
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<OpenInvoice | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id,invoice_number,total,client_id,status")
      .in("status", ["sent", "partially_paid"]);

    if (invError) {
      toast.error(invError.message);
      setLoading(false);
      return;
    }

    const { data: allocations } = await supabase
      .from("payment_allocations")
      .select("invoice_id,amount_applied");

    const paidMap = new Map<string, number>();
    for (const a of allocations ?? []) {
      paidMap.set(a.invoice_id, (paidMap.get(a.invoice_id) ?? 0) + Number(a.amount_applied));
    }

    const open = (invoices ?? [])
      .map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        total: Number(inv.total) || 0,
        client_id: inv.client_id,
        paid_so_far: paidMap.get(inv.id) ?? 0,
      }))
      .filter((inv) => inv.paid_so_far < inv.total);

    setOpenInvoices(open);

    const { data: paymentData, error: payError } = await supabase
      .from("payments")
      .select("id,amount,method,received_date,reference")
      .order("created_at", { ascending: false })
      .limit(20);

    if (payError) {
      toast.error(payError.message);
    } else {
      setPayments(paymentData ?? []);
    }

    setLoading(false);
  }

  function openRecordDialog(invoice: OpenInvoice) {
    setRecording(invoice);
    setAmount((invoice.total - invoice.paid_so_far).toFixed(2));
    setMethod("");
    setReference("");
  }

  async function handleRecordPayment() {
    if (!recording) return;
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    const remaining = recording.total - recording.paid_so_far;
    if (amt > remaining + 0.01) {
      toast.error(`Amount exceeds what's owed (${remaining.toFixed(2)}).`);
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          client_id: recording.client_id,
          amount: amt,
          method: method.trim() || null,
          reference: reference.trim() || null,
          created_by: userData.user?.id ?? null,
        })
        .select("id")
        .single();

      if (paymentError || !paymentData?.id) {
        throw paymentError ?? new Error("Could not create payment.");
      }

      const { error: allocError } = await supabase.from("payment_allocations").insert({
        payment_id: paymentData.id,
        invoice_id: recording.id,
        amount_applied: amt,
      });

      if (allocError) {
        throw allocError;
      }

      // Update invoice status
      const newTotal = recording.paid_so_far + amt;
      const newStatus = newTotal >= recording.total ? "paid" : "partially_paid";
      await supabase.from("invoices").update({ status: newStatus }).eq("id", recording.id);

      toast.success("Payment recorded and posted to the ledger.");
      void logAudit("payments", paymentData.id, "insert", null, {
        invoice_id: recording.id,
        amount: amt,
        method: method.trim() || null,
      });
      setRecording(null);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record client payments against open invoices. Posts to the ledger immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : openInvoices.length === 0 ? (
            <div className="text-sm text-muted-foreground">No open invoices.</div>
          ) : (
            <div className="space-y-2">
              {openInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">{inv.invoice_number}</div>
                    <div className="text-sm text-muted-foreground">
                      Total {inv.total.toFixed(2)} • Paid {inv.paid_so_far.toFixed(2)} • Owed{" "}
                      {(inv.total - inv.paid_so_far).toFixed(2)}
                    </div>
                  </div>
                  <Button onClick={() => openRecordDialog(inv)}>Record payment</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No payments recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-4 text-sm">
                  <span>
                    {p.amount.toFixed(2)} {p.method ? `via ${p.method}` : ""} {p.reference ? `• ${p.reference}` : ""}
                  </span>
                  <span className="text-muted-foreground">{new Date(p.received_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={recording !== null} onOpenChange={(open) => !open && setRecording(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>{recording?.invoice_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Method (optional)</Label>
              <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. M-Pesa, Bank transfer" />
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <Button onClick={handleRecordPayment} disabled={saving} className="w-full">
              {saving ? "Recording…" : "Record payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}