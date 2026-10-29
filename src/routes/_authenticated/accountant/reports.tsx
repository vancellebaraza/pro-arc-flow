import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CsvButton } from "@/components/accountant/CsvButton";

export const Route = createFileRoute("/_authenticated/accountant/reports")({
  component: ReportsPage,
});

interface AccountBalance {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface AgingRow {
  id: string;
  partyId: string;
  party: string;
  dueDate: string | null;
  remaining: number;
  bucket: "current" | "1-30" | "31-60" | "61-90" | "90+";
}

interface PartyView {
  kind: "client" | "vendor";
  id: string;
  name: string;
}

interface PartyDoc {
  id: string;
  number: string;
  status: string;
  date: string;
  due: string | null;
  total: number;
  paid: number;
}

interface PartyPayment {
  id: string;
  date: string;
  amount: number;
  method: string | null;
  reference: string | null;
}

function PartyDialog({ party, onClose }: { party: PartyView | null; onClose: () => void }) {
  const [docs, setDocs] = useState<PartyDoc[]>([]);
  const [payments, setPayments] = useState<PartyPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!party) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        if (party.kind === "client") {
          const [{ data: invs, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
            supabase
              .from("invoices")
              .select("id,invoice_number,status,total,issue_date,due_date")
              .eq("client_id", party.id)
              .order("issue_date", { ascending: false }),
            supabase
              .from("payments")
              .select("id,amount,method,received_date,reference")
              .eq("client_id", party.id)
              .order("received_date", { ascending: false }),
          ]);
          if (e1 || e2) throw e1 ?? e2;
          const ids = (invs ?? []).map((i) => i.id);
          const { data: allocs } = ids.length
            ? await supabase
                .from("payment_allocations")
                .select("invoice_id,amount_applied")
                .in("invoice_id", ids)
            : { data: [] };
          const paid = new Map<string, number>();
          for (const a of allocs ?? [])
            paid.set(a.invoice_id, (paid.get(a.invoice_id) ?? 0) + (Number(a.amount_applied) || 0));
          if (cancelled) return;
          setDocs(
            (invs ?? []).map((i) => ({
              id: i.id,
              number: i.invoice_number,
              status: i.status,
              date: i.issue_date,
              due: i.due_date,
              total: Number(i.total) || 0,
              paid: paid.get(i.id) ?? 0,
            })),
          );
          setPayments(
            (pays ?? []).map((x) => ({
              id: x.id,
              date: x.received_date,
              amount: Number(x.amount) || 0,
              method: x.method,
              reference: x.reference,
            })),
          );
        } else {
          const [{ data: bills, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
            supabase
              .from("bills")
              .select("id,bill_number,description,status,amount,bill_date,due_date")
              .eq("vendor_id", party.id)
              .order("bill_date", { ascending: false }),
            supabase
              .from("vendor_payments")
              .select("id,amount,method,paid_date,reference")
              .eq("vendor_id", party.id)
              .order("paid_date", { ascending: false }),
          ]);
          if (e1 || e2) throw e1 ?? e2;
          const ids = (bills ?? []).map((b) => b.id);
          const { data: allocs } = ids.length
            ? await supabase
                .from("vendor_payment_allocations")
                .select("bill_id,amount_applied")
                .in("bill_id", ids)
            : { data: [] };
          const paid = new Map<string, number>();
          for (const a of allocs ?? [])
            paid.set(a.bill_id, (paid.get(a.bill_id) ?? 0) + (Number(a.amount_applied) || 0));
          if (cancelled) return;
          setDocs(
            (bills ?? []).map((b) => ({
              id: b.id,
              number: b.bill_number || b.description,
              status: b.status,
              date: b.bill_date,
              due: b.due_date,
              total: Number(b.amount) || 0,
              paid: paid.get(b.id) ?? 0,
            })),
          );
          setPayments(
            (pays ?? []).map((x) => ({
              id: x.id,
              date: x.paid_date,
              amount: Number(x.amount) || 0,
              method: x.method,
              reference: x.reference,
            })),
          );
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : String(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      setDocs([]);
      setPayments([]);
    };
  }, [party]);

  const docLabel = party?.kind === "client" ? "Invoices" : "Bills";
  const docHeaders = [
    party?.kind === "client" ? "Invoice" : "Bill",
    "Status",
    "Date",
    "Due",
    "Total",
    "Paid",
    "Balance",
  ];
  const docRows = docs.map((d) => [
    d.number,
    d.status,
    d.date,
    d.due,
    d.total,
    d.paid,
    round2(d.total - d.paid),
  ]);

  return (
    <Dialog open={party !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{party?.name}</DialogTitle>
          <DialogDescription>
            {party?.kind === "client" ? "Client" : "Vendor"} account: {docLabel.toLowerCase()} and
            payments.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{docLabel}</h3>
                <CsvButton
                  name={`${(party?.name ?? "party").replace(/\s+/g, "-").toLowerCase()}-${docLabel.toLowerCase()}`}
                  headers={docHeaders}
                  rows={docRows}
                />
              </div>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2">{docHeaders[0]}</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Due</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr key={d.id} className="border-b">
                        <td className="py-2">{d.number}</td>
                        <td className="py-2 capitalize">{d.status.replace("_", " ")}</td>
                        <td className="py-2">{d.due ?? "—"}</td>
                        <td className="py-2 text-right">{d.total.toFixed(2)}</td>
                        <td className="py-2 text-right">{round2(d.total - d.paid).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">Payments</h3>
                <CsvButton
                  name={`${(party?.name ?? "party").replace(/\s+/g, "-").toLowerCase()}-payments`}
                  headers={["Date", "Amount", "Method", "Reference"]}
                  rows={payments.map((x) => [x.date, x.amount, x.method, x.reference])}
                />
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2">Date</th>
                      <th className="py-2">Method</th>
                      <th className="py-2">Reference</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((x) => (
                      <tr key={x.id} className="border-b">
                        <td className="py-2">{x.date}</td>
                        <td className="py-2">{x.method ?? "—"}</td>
                        <td className="py-2">{x.reference ?? "—"}</td>
                        <td className="py-2 text-right">{x.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function getAgingBucket(dueDate: string | null, today: string): AgingRow["bucket"] {
  if (!dueDate || dueDate >= today) return "current";
  const days = Math.floor(
    (new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

function ReportsPage() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [arAging, setArAging] = useState<AgingRow[]>([]);
  const [apAging, setApAging] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [agingLoading, setAgingLoading] = useState(true);
  const [party, setParty] = useState<PartyView | null>(null);

  useEffect(() => {
    void loadBalances();
    void loadAging();
  }, []);

  async function loadAging() {
    setAgingLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id,total,status,due_date,client_id,client_display_name")
      .in("status", ["sent", "partially_paid"]);

    if (invError) {
      toast.error(invError.message);
      setAgingLoading(false);
      return;
    }

    const { data: paymentAllocs, error: allocError } = await supabase
      .from("payment_allocations")
      .select("invoice_id,amount_applied");

    if (allocError) {
      toast.error(allocError.message);
      setAgingLoading(false);
      return;
    }

    const clientIds = [...new Set((invoices ?? []).map((i) => i.client_id))];
    const { data: profiles, error: profError } =
      clientIds.length > 0
        ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
        : { data: [], error: null };

    if (profError) {
      toast.error(profError.message);
      setAgingLoading(false);
      return;
    }

    const clientNameMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? "Unnamed client"]),
    );
    const paidMap = new Map<string, number>();
    for (const a of paymentAllocs ?? []) {
      paidMap.set(a.invoice_id, (paidMap.get(a.invoice_id) ?? 0) + (Number(a.amount_applied) || 0));
    }

    const ar: AgingRow[] = (invoices ?? [])
      .map((inv) => {
        const remaining = (Number(inv.total) || 0) - (paidMap.get(inv.id) ?? 0);
        return {
          id: inv.id,
          partyId: inv.client_id,
          party: inv.client_display_name ?? clientNameMap.get(inv.client_id) ?? "Unknown client",
          dueDate: inv.due_date,
          remaining,
          bucket: getAgingBucket(inv.due_date, today),
        };
      })
      .filter((r) => r.remaining > 0.01);

    setArAging(ar);

    const { data: bills, error: billError } = await supabase
      .from("bills")
      .select("id,amount,status,due_date,vendor_id")
      .in("status", ["approved", "partially_paid"]);

    if (billError) {
      toast.error(billError.message);
      setAgingLoading(false);
      return;
    }

    const { data: vendorAllocs, error: vAllocError } = await supabase
      .from("vendor_payment_allocations")
      .select("bill_id,amount_applied");

    if (vAllocError) {
      toast.error(vAllocError.message);
      setAgingLoading(false);
      return;
    }

    const vendorIds = [...new Set((bills ?? []).map((b) => b.vendor_id))];
    const { data: vendors, error: vendorError } =
      vendorIds.length > 0
        ? await supabase.from("vendors").select("id,name").in("id", vendorIds)
        : { data: [], error: null };

    if (vendorError) {
      toast.error(vendorError.message);
      setAgingLoading(false);
      return;
    }

    const vendorNameMap = new Map((vendors ?? []).map((v) => [v.id, v.name]));
    const vendorPaidMap = new Map<string, number>();
    for (const a of vendorAllocs ?? []) {
      vendorPaidMap.set(
        a.bill_id,
        (vendorPaidMap.get(a.bill_id) ?? 0) + (Number(a.amount_applied) || 0),
      );
    }

    const ap: AgingRow[] = (bills ?? [])
      .map((b) => {
        const remaining = (Number(b.amount) || 0) - (vendorPaidMap.get(b.id) ?? 0);
        return {
          id: b.id,
          partyId: b.vendor_id,
          party: vendorNameMap.get(b.vendor_id) ?? "Unknown vendor",
          dueDate: b.due_date,
          remaining,
          bucket: getAgingBucket(b.due_date, today),
        };
      })
      .filter((r) => r.remaining > 0.01);

    setApAging(ap);
    setAgingLoading(false);
  }

  async function loadBalances() {
    setLoading(true);

    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("id,code,name,type")
      .order("code");

    if (accError) {
      toast.error(accError.message);
      setLoading(false);
      return;
    }

    const { data: lines, error: lineError } = await supabase
      .from("journal_lines")
      .select("account_id,debit,credit");

    if (lineError) {
      toast.error(lineError.message);
      setLoading(false);
      return;
    }

    const sums = new Map<string, { debit: number; credit: number }>();
    for (const line of lines ?? []) {
      const current = sums.get(line.account_id) ?? { debit: 0, credit: 0 };
      current.debit += Number(line.debit) || 0;
      current.credit += Number(line.credit) || 0;
      sums.set(line.account_id, current);
    }

    const result: AccountBalance[] = (accounts ?? []).map((acc) => {
      const s = sums.get(acc.id) ?? { debit: 0, credit: 0 };
      // Asset/Expense accounts: normal balance is debit (debit - credit).
      // Liability/Equity/Revenue accounts: normal balance is credit (credit - debit).
      const isDebitNormal = acc.type === "asset" || acc.type === "expense";
      const balance = isDebitNormal ? s.debit - s.credit : s.credit - s.debit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: s.debit,
        credit: s.credit,
        balance,
      };
    });

    setBalances(result);
    setLoading(false);
  }

  // Trial Balance: net per account. Debit minus credit, positive goes in Debit, otherwise
  // the absolute value goes in Credit. Everything is rounded to cents before it is summed.
  const trialBalanceRows = useMemo(
    () =>
      balances
        .map((b) => {
          const net = round2(b.debit - b.credit);
          return {
            id: b.id,
            code: b.code,
            name: b.name,
            debit: net > 0 ? net : 0,
            credit: net > 0 ? 0 : Math.abs(net),
            net,
          };
        })
        .filter((r) => r.net !== 0),
    [balances],
  );
  const trialBalanceTotals = useMemo(
    () =>
      trialBalanceRows.reduce(
        (acc, b) => ({ debit: round2(acc.debit + b.debit), credit: round2(acc.credit + b.credit) }),
        { debit: 0, credit: 0 },
      ),
    [trialBalanceRows],
  );
  const trialBalanceDiff = round2(trialBalanceTotals.debit - trialBalanceTotals.credit);

  // P&L: revenue and expense accounts
  const revenueRows = useMemo(
    () => balances.filter((b) => b.type === "revenue" && b.balance !== 0),
    [balances],
  );
  const expenseRows = useMemo(
    () => balances.filter((b) => b.type === "expense" && b.balance !== 0),
    [balances],
  );
  const totalRevenue = useMemo(
    () => revenueRows.reduce((sum, r) => sum + r.balance, 0),
    [revenueRows],
  );
  const totalExpenses = useMemo(
    () => expenseRows.reduce((sum, r) => sum + r.balance, 0),
    [expenseRows],
  );
  const netProfit = totalRevenue - totalExpenses;

  // Balance Sheet: assets, liabilities, equity
  const assetRows = useMemo(
    () => balances.filter((b) => b.type === "asset" && b.balance !== 0),
    [balances],
  );
  const liabilityRows = useMemo(
    () => balances.filter((b) => b.type === "liability" && b.balance !== 0),
    [balances],
  );
  const equityRows = useMemo(
    () => balances.filter((b) => b.type === "equity" && b.balance !== 0),
    [balances],
  );
  const totalAssets = useMemo(() => assetRows.reduce((sum, r) => sum + r.balance, 0), [assetRows]);
  const totalLiabilities = useMemo(
    () => liabilityRows.reduce((sum, r) => sum + r.balance, 0),
    [liabilityRows],
  );
  const totalEquityBase = useMemo(
    () => equityRows.reduce((sum, r) => sum + r.balance, 0),
    [equityRows],
  );
  // Retained earnings for the sheet = net profit not yet formally closed to equity
  const totalEquity = totalEquityBase + netProfit;

  return (
    <div className="fade-in flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Computed live from the general ledger — never stored, always current.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <Tabs defaultValue="trial-balance">
          <TabsList>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="pl">Profit &amp; Loss</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="aging">AR/AP Aging</TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Trial Balance</CardTitle>
                  <CsvButton
                    name="trial-balance"
                    headers={["Code", "Account", "Debit", "Credit"]}
                    rows={[
                      ...trialBalanceRows.map((r) => [
                        r.code,
                        r.name,
                        r.debit || "",
                        r.credit || "",
                      ]),
                      ["", "Total", trialBalanceTotals.debit, trialBalanceTotals.credit],
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2">Code</th>
                      <th className="py-2">Account</th>
                      <th className="py-2 text-right">Debit</th>
                      <th className="py-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalanceRows.map((row) => (
                      <tr
                        key={row.code}
                        className="cursor-pointer border-b hover:bg-muted/50"
                        tabIndex={0}
                        role="link"
                        title="Open account ledger"
                        onClick={() =>
                          void navigate({
                            to: "/accountant/account-ledger",
                            search: { account: row.id },
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            void navigate({
                              to: "/accountant/account-ledger",
                              search: { account: row.id },
                            });
                        }}
                      >
                        <td className="py-2">{row.code}</td>
                        <td className="py-2">{row.name}</td>
                        <td className="py-2 text-right">
                          {row.debit > 0 ? row.debit.toFixed(2) : ""}
                        </td>
                        <td className="py-2 text-right">
                          {row.credit > 0 ? row.credit.toFixed(2) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold">
                      <td colSpan={2} className="py-2">
                        Total
                      </td>
                      <td className="py-2 text-right">{trialBalanceTotals.debit.toFixed(2)}</td>
                      <td className="py-2 text-right">{trialBalanceTotals.credit.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                <p
                  className={`mt-3 text-sm font-medium ${trialBalanceDiff === 0 ? "text-green-700" : "text-red-700"}`}
                  data-testid="tb-check"
                >
                  {trialBalanceDiff === 0
                    ? "Balanced"
                    : `Out by ${Math.abs(trialBalanceDiff).toFixed(2)} (${trialBalanceDiff > 0 ? "debits exceed credits" : "credits exceed debits"})`}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pl">
            <Card>
              <CardHeader>
                <CardTitle>Profit &amp; Loss</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 font-medium">Revenue</h3>
                  {revenueRows.map((r) => (
                    <div key={r.code} className="flex justify-between py-1 text-sm">
                      <span>{r.name}</span>
                      <span>{r.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t py-1 text-sm font-medium">
                    <span>Total Revenue</span>
                    <span>{totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-medium">Expenses</h3>
                  {expenseRows.map((r) => (
                    <div key={r.code} className="flex justify-between py-1 text-sm">
                      <span>{r.name}</span>
                      <span>{r.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t py-1 text-sm font-medium">
                    <span>Total Expenses</span>
                    <span>{totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between border-t-2 pt-2 text-base font-semibold">
                  <span>Net Profit</span>
                  <span className={netProfit >= 0 ? "text-green-700" : "text-red-700"}>
                    {netProfit.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance-sheet">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 font-medium">Assets</h3>
                  {assetRows.map((r) => (
                    <div key={r.code} className="flex justify-between py-1 text-sm">
                      <span>{r.name}</span>
                      <span>{r.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t py-1 text-sm font-medium">
                    <span>Total Assets</span>
                    <span>{totalAssets.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-medium">Liabilities</h3>
                  {liabilityRows.map((r) => (
                    <div key={r.code} className="flex justify-between py-1 text-sm">
                      <span>{r.name}</span>
                      <span>{r.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t py-1 text-sm font-medium">
                    <span>Total Liabilities</span>
                    <span>{totalLiabilities.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-medium">Equity</h3>
                  {equityRows.map((r) => (
                    <div key={r.code} className="flex justify-between py-1 text-sm">
                      <span>{r.name}</span>
                      <span>{r.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 text-sm">
                    <span>Retained Earnings (current period net profit)</span>
                    <span>{netProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t py-1 text-sm font-medium">
                    <span>Total Equity</span>
                    <span>{totalEquity.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between border-t-2 pt-2 text-base font-semibold">
                  <span>Assets = Liabilities + Equity?</span>
                  <span
                    className={
                      Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {totalAssets.toFixed(2)}{" "}
                    {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "=" : "≠"}{" "}
                    {(totalLiabilities + totalEquity).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aging">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Accounts Receivable Aging</CardTitle>
                    <CsvButton
                      name="ar-aging"
                      headers={["Client", "Due date", "Bucket", "Owed"]}
                      rows={arAging.map((r) => [r.party, r.dueDate, r.bucket, round2(r.remaining)])}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {agingLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : arAging.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No unpaid invoices.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2">Client</th>
                          <th className="py-2">Due Date</th>
                          <th className="py-2">Bucket</th>
                          <th className="py-2 text-right">Owed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {arAging.map((row) => (
                          <tr
                            key={row.id}
                            className="cursor-pointer border-b hover:bg-muted/50"
                            tabIndex={0}
                            role="button"
                            title="View invoices and payments"
                            onClick={() =>
                              setParty({ kind: "client", id: row.partyId, name: row.party })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                setParty({ kind: "client", id: row.partyId, name: row.party });
                            }}
                          >
                            <td className="py-2">{row.party}</td>
                            <td className="py-2">{row.dueDate ?? "—"}</td>
                            <td className="py-2">
                              <span
                                className={
                                  row.bucket === "current"
                                    ? "text-muted-foreground"
                                    : row.bucket === "90+"
                                      ? "font-medium text-red-700"
                                      : "text-amber-700"
                                }
                              >
                                {row.bucket}
                              </span>
                            </td>
                            <td className="py-2 text-right">{row.remaining.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold">
                          <td colSpan={3} className="py-2">
                            Total
                          </td>
                          <td className="py-2 text-right">
                            {arAging.reduce((s, r) => s + r.remaining, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Accounts Payable Aging</CardTitle>
                    <CsvButton
                      name="ap-aging"
                      headers={["Vendor", "Due date", "Bucket", "Owed"]}
                      rows={apAging.map((r) => [r.party, r.dueDate, r.bucket, round2(r.remaining)])}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {agingLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : apAging.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No unpaid bills.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2">Vendor</th>
                          <th className="py-2">Due Date</th>
                          <th className="py-2">Bucket</th>
                          <th className="py-2 text-right">Owed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apAging.map((row) => (
                          <tr
                            key={row.id}
                            className="cursor-pointer border-b hover:bg-muted/50"
                            tabIndex={0}
                            role="button"
                            title="View bills and payments"
                            onClick={() =>
                              setParty({ kind: "vendor", id: row.partyId, name: row.party })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                setParty({ kind: "vendor", id: row.partyId, name: row.party });
                            }}
                          >
                            <td className="py-2">{row.party}</td>
                            <td className="py-2">{row.dueDate ?? "—"}</td>
                            <td className="py-2">
                              <span
                                className={
                                  row.bucket === "current"
                                    ? "text-muted-foreground"
                                    : row.bucket === "90+"
                                      ? "font-medium text-red-700"
                                      : "text-amber-700"
                                }
                              >
                                {row.bucket}
                              </span>
                            </td>
                            <td className="py-2 text-right">{row.remaining.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold">
                          <td colSpan={3} className="py-2">
                            Total
                          </td>
                          <td className="py-2 text-right">
                            {apAging.reduce((s, r) => s + r.remaining, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
      <PartyDialog party={party} onClose={() => setParty(null)} />
    </div>
  );
}
