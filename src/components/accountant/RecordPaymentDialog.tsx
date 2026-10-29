import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { ConfirmDialog } from "@/components/accountant/ConfirmDialog";

export interface PayableInvoice {
  id: string;
  invoice_number: string;
  total: number;
  client_id: string;
  client_name: string | null;
  paid_so_far: number;
}

interface DepositAccount {
  id: string;
  code: string;
  name: string;
}

interface Props {
  invoice: PayableInvoice | null;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function RecordPaymentDialog({ invoice, onClose, onDone }: Props) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [accounts, setAccounts] = useState<DepositAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  // Synchronous lock: state updates are async, so two fast clicks could both pass a `saving` check.
  const inFlight = useRef(false);
  // If the payment row was written but the allocation failed, a retry reuses it instead of inserting a duplicate.
  const createdPaymentId = useRef<string | null>(null);

  useEffect(() => {
    if (!invoice) return;
    setAmount(round2(invoice.total - invoice.paid_so_far).toFixed(2));
    setMethod("");
    setReference("");
    setConfirming(false);
    createdPaymentId.current = null;
    void (async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id,code,name")
        .eq("type", "asset")
        .like("code", "10%")
        .eq("is_active", true)
        .order("code");
      setAccounts(data ?? []);
      const bank = (data ?? []).find((a) => a.code === "1000");
      setAccountId(bank?.id ?? data?.[0]?.id ?? "");
    })();
  }, [invoice]);

  if (!invoice) return null;
  const remaining = round2(invoice.total - invoice.paid_so_far);

  function validate(): number | null {
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount.");
      return null;
    }
    if (amt > remaining + 0.01) {
      toast.error(`Amount exceeds what is owed (${remaining.toFixed(2)}).`);
      return null;
    }
    if (!accountId) {
      toast.error("Pick which account this payment landed in.");
      return null;
    }
    return round2(amt);
  }

  async function submit() {
    if (!invoice || inFlight.current) return;
    const amt = validate();
    if (amt === null) return;
    inFlight.current = true;
    setSaving(true);
    try {
      let paymentId = createdPaymentId.current;
      if (!paymentId) {
        const { data: userData } = await getUserCached();
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .insert({
            client_id: invoice.client_id,
            amount: amt,
            method: method.trim() || null,
            reference: reference.trim() || null,
            deposit_account_id: accountId,
            created_by: userData.user?.id ?? null,
          })
          .select("id")
          .single();
        if (paymentError || !paymentData?.id)
          throw paymentError ?? new Error("Could not create payment.");
        paymentId = paymentData.id as string;
        createdPaymentId.current = paymentId;
      }

      const { error: allocError } = await supabase.from("payment_allocations").insert({
        payment_id: paymentId,
        invoice_id: invoice.id,
        amount_applied: amt,
      });
      if (allocError) throw allocError;

      const newStatus =
        invoice.paid_so_far + amt >= invoice.total - 0.005 ? "paid" : "partially_paid";
      await supabase.from("invoices").update({ status: newStatus }).eq("id", invoice.id);

      void logAudit("payments", paymentId, "insert", null, {
        invoice_id: invoice.id,
        amount: amt,
        method: method.trim() || null,
      });
      toast.success("Payment recorded and posted to the ledger.");
      setConfirming(false);
      onClose();
      await onDone();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : String(error));
      setConfirming(false);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={!confirming} onOpenChange={(open) => !open && !saving && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {invoice.client_name ? `${invoice.client_name} • ` : ""}
              {invoice.invoice_number} • Total {invoice.total.toFixed(2)} • Balance due{" "}
              {remaining.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deposited to</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Method (optional)</Label>
              <Input
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="e.g. M-Pesa, Bank transfer"
              />
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <Button
              onClick={() => validate() !== null && setConfirming(true)}
              disabled={!accountId}
              className="w-full"
            >
              Review and record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        title="Post this payment to the ledger?"
        description={`${Number(amount || 0).toFixed(2)} from ${invoice.client_name ?? "client"} against ${invoice.invoice_number}. This posts to the general ledger immediately.`}
        confirmLabel="Record payment"
        busy={saving}
        onConfirm={() => void submit()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
