import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CsvButton } from "@/components/accountant/CsvButton";
import {
  RecordPaymentDialog,
  type PayableInvoice,
} from "@/components/accountant/RecordPaymentDialog";

export const Route = createFileRoute("/_authenticated/accountant/payments")({
  component: PaymentsPage,
});

interface PaymentRecord {
  id: string;
  amount: number;
  method: string | null;
  received_date: string;
  reference: string | null;
}

function PaymentsPage() {
  const [openInvoices, setOpenInvoices] = useState<PayableInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<PayableInvoice | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id,invoice_number,total,client_id,client_display_name,status")
      .in("status", ["sent", "partially_paid"]) // void invoices are excluded by this status list
      .neq("status", "void");

    if (invError) {
      toast.error(invError.message);
      setLoading(false);
      return;
    }

    const { data: allocations } = await supabase
      .from("payment_allocations")
      .select("invoice_id,amount_applied,payments!inner(voided_at)")
      .is("payments.voided_at", null);

    const paidMap = new Map<string, number>();
    for (const a of allocations ?? []) {
      paidMap.set(a.invoice_id, (paidMap.get(a.invoice_id) ?? 0) + Number(a.amount_applied));
    }

    const clientIds = [...new Set((invoices ?? []).map((i) => i.client_id).filter(Boolean))];
    const { data: profiles } =
      clientIds.length > 0
        ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
        : { data: [] };
    const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));

    const open = (invoices ?? [])
      .map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        total: Number(inv.total) || 0,
        client_id: inv.client_id,
        client_name: inv.client_display_name ?? names.get(inv.client_id) ?? null,
        paid_so_far: paidMap.get(inv.id) ?? 0,
      }))
      .filter((inv) => inv.paid_so_far < inv.total);

    setOpenInvoices(open);

    const { data: paymentData, error: payError } = await supabase
      .from("payments")
      .select("id,amount,method,received_date,reference")
      .is("voided_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (payError) {
      toast.error(payError.message);
    } else {
      setPayments(paymentData ?? []);
    }

    setLoading(false);
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">Payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record client payments against open invoices. Posts to the ledger immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Open invoices</CardTitle>
            <CsvButton
              name="open-invoices"
              headers={["Invoice", "Client", "Total", "Paid", "Owed"]}
              rows={openInvoices.map((i) => [
                i.invoice_number,
                i.client_name,
                i.total,
                i.paid_so_far,
                Math.round((i.total - i.paid_so_far) * 100) / 100,
              ])}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : openInvoices.length === 0 ? (
            <div className="text-sm text-muted-foreground">No open invoices.</div>
          ) : (
            <div className="space-y-2">
              {openInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium">
                      {inv.invoice_number}
                      {inv.client_name ? ` — ${inv.client_name}` : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total {inv.total.toFixed(2)} • Paid {inv.paid_so_far.toFixed(2)} • Owed{" "}
                      {(inv.total - inv.paid_so_far).toFixed(2)}
                    </div>
                  </div>
                  <Button onClick={() => setRecording(inv)}>Record payment</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Recent payments</CardTitle>
            <CsvButton
              name="payments"
              headers={["Received", "Amount", "Method", "Reference"]}
              rows={payments.map((p) => [p.received_date, Number(p.amount), p.method, p.reference])}
            />
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No payments recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-4 text-sm"
                >
                  <span>
                    {Number(p.amount).toFixed(2)} {p.method ? `via ${p.method}` : ""}{" "}
                    {p.reference ? `• ${p.reference}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(p.received_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        invoice={recording}
        onClose={() => setRecording(null)}
        onDone={() => loadData()}
      />
    </div>
  );
}
