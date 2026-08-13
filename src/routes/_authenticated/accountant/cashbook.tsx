import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/cashbook")({
  component: CashbookPage,
});

interface CashbookRow {
  id: string;
  date: string;
  direction: "in" | "out";
  party: string;
  method: string | null;
  reference: string | null;
  amount: number;
}

interface DisplayRow extends CashbookRow {
  runningBalance: number;
}

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CashbookPage() {
  const [rows, setRows] = useState<CashbookRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadCashbook();
  }, []);

  async function loadCashbook() {
    setLoading(true);

    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("id,client_id,amount,method,received_date,reference");

    if (payError) {
      toast.error(payError.message);
      setLoading(false);
      return;
    }

    const { data: vendorPayments, error: vpError } = await supabase
      .from("vendor_payments")
      .select("id,vendor_id,amount,method,paid_date,reference");

    if (vpError) {
      toast.error(vpError.message);
      setLoading(false);
      return;
    }

    const clientIds = [...new Set((payments ?? []).map((p) => p.client_id))];
    const vendorIds = [...new Set((vendorPayments ?? []).map((p) => p.vendor_id))];

    const [{ data: profiles, error: profError }, { data: vendors, error: vendError }] = await Promise.all([
      clientIds.length > 0
        ? supabase.from("profiles").select("id,full_name").in("id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      vendorIds.length > 0
        ? supabase.from("vendors").select("id,name").in("id", vendorIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profError) {
      toast.error(profError.message);
      setLoading(false);
      return;
    }
    if (vendError) {
      toast.error(vendError.message);
      setLoading(false);
      return;
    }

    const clientNameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Unnamed client"]));
    const vendorNameMap = new Map((vendors ?? []).map((v) => [v.id, v.name]));

    const inRows: CashbookRow[] = (payments ?? []).map((p) => ({
      id: `pay-${p.id}`,
      date: p.received_date,
      direction: "in",
      party: clientNameMap.get(p.client_id) ?? "Unknown client",
      method: p.method,
      reference: p.reference,
      amount: Number(p.amount) || 0,
    }));

    const outRows: CashbookRow[] = (vendorPayments ?? []).map((p) => ({
      id: `vpay-${p.id}`,
      date: p.paid_date,
      direction: "out",
      party: vendorNameMap.get(p.vendor_id) ?? "Unknown vendor",
      method: p.method,
      reference: p.reference,
      amount: Number(p.amount) || 0,
    }));

    const merged = [...inRows, ...outRows].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    setRows(merged);
    setLoading(false);
  }

  const displayRows: DisplayRow[] = useMemo(() => {
    let balance = 0;
    return rows.map((r) => {
      balance += r.direction === "in" ? r.amount : -r.amount;
      return { ...r, runningBalance: balance };
    });
  }, [rows]);

  const totals = useMemo(() => {
    const totalIn = rows.filter((r) => r.direction === "in").reduce((s, r) => s + r.amount, 0);
    const totalOut = rows.filter((r) => r.direction === "out").reduce((s, r) => s + r.amount, 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [rows]);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cashbook</h1>
        <p className="text-muted-foreground">
          A running log of every payment received from clients and every payment made to vendors, in date order.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total received</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-green-600">{formatKes(totals.totalIn)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total paid out</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-red-600">{formatKes(totals.totalOut)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Net cash movement</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatKes(totals.net)}</CardContent>
        </Card>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Party</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 text-right font-medium">In (KES)</th>
              <th className="px-4 py-3 text-right font-medium">Out (KES)</th>
              <th className="px-4 py-3 text-right font-medium">Balance (KES)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No cash movements recorded yet.
                </td>
              </tr>
            ) : (
              displayRows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.party}</td>
                  <td className="px-4 py-3">{row.method ?? "—"}</td>
                  <td className="px-4 py-3">{row.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {row.direction === "in" ? row.amount.toFixed(2) : ""}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {row.direction === "out" ? row.amount.toFixed(2) : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{row.runningBalance.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
