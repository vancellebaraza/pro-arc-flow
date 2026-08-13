import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/")({
  component: AccountantDashboardPage,
});

interface DashboardData {
  cashPosition: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;
  overdueBillsCount: number;
  overdueBillsTotal: number;
}

const CASH_ACCOUNT_CODES = ["1000", "1010"]; // Cash, Bank

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AccountantDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const { data: cashAccounts, error: cashAcctError } = await supabase
      .from("accounts")
      .select("id,code")
      .in("code", CASH_ACCOUNT_CODES);

    if (cashAcctError) {
      toast.error(cashAcctError.message);
      setLoading(false);
      return;
    }

    const cashAccountIds = (cashAccounts ?? []).map((a) => a.id);
    let cashPosition = 0;

    if (cashAccountIds.length > 0) {
      const { data: cashLines, error: cashLineError } = await supabase
        .from("journal_lines")
        .select("debit,credit")
        .in("account_id", cashAccountIds);

      if (cashLineError) {
        toast.error(cashLineError.message);
        setLoading(false);
        return;
      }

      cashPosition = (cashLines ?? []).reduce(
        (sum, l) => sum + (Number(l.debit) || 0) - (Number(l.credit) || 0),
        0,
      );
    }

    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id,total,status")
      .in("status", ["sent", "partially_paid"]);

    if (invError) {
      toast.error(invError.message);
      setLoading(false);
      return;
    }

    const { data: paymentAllocs, error: allocError } = await supabase
      .from("payment_allocations")
      .select("invoice_id,amount_applied");

    if (allocError) {
      toast.error(allocError.message);
      setLoading(false);
      return;
    }

    const paidMap = new Map<string, number>();
    for (const a of paymentAllocs ?? []) {
      paidMap.set(a.invoice_id, (paidMap.get(a.invoice_id) ?? 0) + (Number(a.amount_applied) || 0));
    }

    const openInvoices = (invoices ?? [])
      .map((inv) => ({
        total: Number(inv.total) || 0,
        remaining: (Number(inv.total) || 0) - (paidMap.get(inv.id) ?? 0),
      }))
      .filter((inv) => inv.remaining > 0.01);

    const unpaidInvoicesCount = openInvoices.length;
    const unpaidInvoicesTotal = openInvoices.reduce((sum, inv) => sum + inv.remaining, 0);

    const today = new Date().toISOString().slice(0, 10);

    const { data: bills, error: billError } = await supabase
      .from("bills")
      .select("id,amount,status,due_date")
      .in("status", ["approved", "partially_paid"])
      .lt("due_date", today);

    if (billError) {
      toast.error(billError.message);
      setLoading(false);
      return;
    }

    const { data: vendorAllocs, error: vAllocError } = await supabase
      .from("vendor_payment_allocations")
      .select("bill_id,amount_applied");

    if (vAllocError) {
      toast.error(vAllocError.message);
      setLoading(false);
      return;
    }

    const vendorPaidMap = new Map<string, number>();
    for (const a of vendorAllocs ?? []) {
      vendorPaidMap.set(a.bill_id, (vendorPaidMap.get(a.bill_id) ?? 0) + (Number(a.amount_applied) || 0));
    }

    const overdueBills = (bills ?? [])
      .map((b) => ({
        amount: Number(b.amount) || 0,
        remaining: (Number(b.amount) || 0) - (vendorPaidMap.get(b.id) ?? 0),
      }))
      .filter((b) => b.remaining > 0.01);

    const overdueBillsCount = overdueBills.length;
    const overdueBillsTotal = overdueBills.reduce((sum, b) => sum + b.remaining, 0);

    setData({
      cashPosition,
      unpaidInvoicesCount,
      unpaidInvoicesTotal,
      overdueBillsCount,
      overdueBillsTotal,
    });
    setLoading(false);
  }

  const cards = data
    ? [
        {
          title: "Cash position",
          value: formatKes(data.cashPosition),
          sub: "Cash + Bank",
          to: "/accountant/reports",
        },
        {
          title: "Unpaid invoices",
          value: formatKes(data.unpaidInvoicesTotal),
          sub: `${data.unpaidInvoicesCount} invoice${data.unpaidInvoicesCount === 1 ? "" : "s"} outstanding`,
          to: "/accountant/payments",
        },
        {
          title: "Overdue bills",
          value: formatKes(data.overdueBillsTotal),
          sub: `${data.overdueBillsCount} bill${data.overdueBillsCount === 1 ? "" : "s"} past due`,
          to: "/accountant/vendor-payments",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Accounting overview</h1>
        <p className="text-muted-foreground">
          Live figures from the general ledger, invoices, and bills.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-6 w-32 animate-pulse rounded bg-muted" />
            </div>
          ))
        ) : (
          cards.map((card) => (
            <Link key={card.title} to={card.to} className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent">
              <div className="text-sm text-muted-foreground">{card.title}</div>
              <div className="mt-3 text-xl font-semibold">{card.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{card.sub}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
