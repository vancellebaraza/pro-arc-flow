import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { logAudit } from "@/lib/auditLog";
import { getUserCached } from "@/lib/auth-cache";
import { CsvButton } from "@/components/accountant/CsvButton";
import { ConfirmDialog } from "@/components/accountant/ConfirmDialog";

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

interface PaymentSourceAccount {
  id: string;
  code: string;
  name: string;
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
  const [confirmingPay, setConfirmingPay] = useState(false);
  // Synchronous lock against double submit (state updates are async).
  const payInFlight = useRef(false);
  const [sourceAccounts, setSourceAccounts] = useState<PaymentSourceAccount[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: accountRows } = await supabase
      .from("accounts")
      .select("id,code,name")
      .eq("type", "asset")
      .like("code", "10%")
      .eq("is_active", true)
      .order("code");
    setSourceAccounts(accountRows ?? []);

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
    const bank = sourceAccounts.find((a) => a.code === "1000");
    setSourceAccountId(bank?.id ?? sourceAccounts[0]?.id ?? "");
  }

  async function handleRecordPayment() {
    if (!recording || payInFlight.current) return;
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
    if (!sourceAccountId) {
      toast.error("Pick which account this payment came from.");
      return;
    }

    payInFlight.current = true;
    setSaving(true);
    try {
      const { data: userData } = await getUserCached();

      const { data: paymentData, error: paymentError } = await supabase
        .from("vendor_payments")
        .insert({
          vendor_id: recording.vendor_id,
          amount: amt,
          method: method.trim() || null,
          reference: reference.trim() || null,
          payment_account_id: sourceAccountId,
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
      void logAudit("vendor_payments", paymentData.id, "insert", null, {
        bill_id: recording.id,
        amount: amt,
        method: method.trim() || null,
      });
      setRecording(null);
      await loadData();
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : `${error}`;
      toast.error(message);
    } finally {
      payInFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">Vendor Payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record payments to vendors against approved bills. Posts to the ledger immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Unpaid bills</CardTitle>
            <CsvButton
              name="unpaid-bills"
              headers={["Bill number", "Description", "Amount", "Paid", "Owed"]}
              rows={openBills.map((b) => [
                b.bill_number,
                b.description,
                b.amount,
                b.paid_so_far,
                Math.round((b.amount - b.paid_so_far) * 100) / 100,
              ])}
            />
          </div>
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
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Recent vendor payments</CardTitle>
            <CsvButton
              name="vendor-payments"
              headers={["Paid", "Amount", "Method", "Reference"]}
              rows={payments.map((p) => [p.paid_date, Number(p.amount), p.method, p.reference])}
            />
          </div>
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
              <Label>Pay from</Label>
              <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {sourceAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Method (optional)</Label>
              <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. M-Pesa, Bank transfer" />
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <Button onClick={() => setConfirmingPay(true)} disabled={saving || !sourceAccountId} className="w-full">
              {saving ? "Recording…" : "Record payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingPay}
        title="Post this vendor payment to the ledger?"
        description={`${Number(amount || 0).toFixed(2)} against ${recording?.bill_number ?? recording?.description ?? "this bill"}. This posts to the general ledger immediately.`}
        confirmLabel="Record payment"
        busy={saving}
        onConfirm={() => {
          void handleRecordPayment().finally(() => setConfirmingPay(false));
        }}
        onCancel={() => setConfirmingPay(false)}
      />
    </div>
  );
}