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

export const Route = createFileRoute("/_authenticated/accountant/vendor-payments")({
  component: VendorPaymentsPage,
});

interface OpenBill {
  id: string;
  description: string;
  bill_number: string | null;
  amount: number;
  vendor_id: string;
  paid_so_far: number;
}

interface VendorPaymentRecord {
  id: string;
  amount: number;
  method: string | null;
  paid_date: string;
  reference: string | null;
}

function VendorPaymentsPage() {
  const [openBills, setOpenBills] = useState<OpenBill[]>([]);
  const [payments, setPayments] = useState<VendorPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<OpenBill | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: bills, error: billError } = await supabase
      .from("bills")
      .select("id,description,bill_number,amount,vendor_id,status")
      .in("status", ["approved", "partially_paid"]);

    if (billError) {
      toast.error(billError.message);
      setLoading(false);
      return;
    }

    const { data: allocations } = await supabase
      .from("vendor_payment_allocations")
      .select("bill_id,amount_applied");

    const paidMap = new Map<string, number>();
    for (const a of allocations ?? []) {
      paidMap.set(a.bill_id, (paidMap.get(a.bill_id) ?? 0) + Number(a.amount_applied));
    }

    const open = (bills ?? [])
      .map((b) => ({
        id: b.id,
        description: b.description,
        bill_number: b.bill_number,
        amount: Number(b.amount) || 0,
        vendor_id: b.vendor_id,
        paid_so_far: paidMap.get(b.id) ?? 0,
      }))
      .filter((b) => b.paid_so_far < b.amount);

    setOpenBills(open);

    const { data: paymentData, error: payError } = await supabase
      .from("vendor_payments")
      .select("id,amount,method,paid_date,reference")
      .order("created_at", { ascending: false })
      .limit(20);

    if (payError) {
      toast.error(payError.message);
    } else {
      setPayments(paymentData ?? []);
    }

    setLoading(false);
  }

  function openRecordDialog(bill: OpenBill) {
    setRecording(bill);
    setAmount((bill.amount - bill.paid_so_far).toFixed(2));
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
    const remaining = recording.amount - recording.paid_so_far;
    if (amt > remaining + 0.01) {
      toast.error(`Amount exceeds what's owed (${remaining.toFixed(2)}).`);
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data: paymentData, error: paymentError } = await supabase
        .from("vendor_payments")
        .insert({
          vendor_id: recording.vendor_id,
          amount: amt,
          method: method.trim() || null,
          reference: reference.trim() || null,
          created_by: userData.user?.id ?? null,
        })
        .select("id")
        .single();

      if (paymentError || !paymentData?.id) {
        throw paymentError ?? new Error("Could not create vendor payment.");
      }

      const { error: allocError } = await supabase.from("vendor_payment_allocations").insert({
        vendor_payment_id: paymentData.id,
        bill_id: recording.id,
        amount_applied: amt,
      });

      if (allocError) {
        throw allocError;
      }

      const newTotal = recording.paid_so_far + amt;
      const newStatus: "paid" | "partially_paid" = newTotal >= recording.amount ? "paid" : "partially_paid";
      await supabase.from("bills").update({ status: newStatus }).eq("id", recording.id);

      toast.success("Vendor payment recorded and posted to the ledger.");
      setRecording(null);
      await loadData();
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : `${error}`;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendor Payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record payments to vendors against approved bills. Posts to the ledger immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unpaid bills</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : openBills.length === 0 ? (
            <div className="text-sm text-muted-foreground">No unpaid bills.</div>
          ) : (
            <div className="space-y-2">
              {openBills.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">{b.description}</div>
                    <div className="text-sm text-muted-foreground">
                      Amount {b.amount.toFixed(2)} • Paid {b.paid_so_far.toFixed(2)} • Owed{" "}
                      {(b.amount - b.paid_so_far).toFixed(2)}
                      {b.bill_number ? ` • Ref: ${b.bill_number}` : ""}
                    </div>
                  </div>
                  <Button onClick={() => openRecordDialog(b)}>Record payment</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent vendor payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No vendor payments recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-4 text-sm">
                  <span>
                    {p.amount.toFixed(2)} {p.method ? `via ${p.method}` : ""} {p.reference ? `• ${p.reference}` : ""}
                  </span>
                  <span className="text-muted-foreground">{new Date(p.paid_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={recording !== null} onOpenChange={(open) => !open && setRecording(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record vendor payment</DialogTitle>
            <DialogDescription>{recording?.description}</DialogDescription>
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