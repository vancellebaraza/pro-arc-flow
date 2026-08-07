import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/reports")({
  component: ReportsPage,
});

interface AccountBalance {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

function ReportsPage() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadBalances();
  }, []);

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

  // Trial Balance: every account with nonzero activity, debit/credit totals
  const trialBalanceRows = useMemo(
    () => balances.filter((b) => b.debit !== 0 || b.credit !== 0),
    [balances],
  );
  const trialBalanceTotals = useMemo(
    () => trialBalanceRows.reduce((acc, b) => ({ debit: acc.debit + b.debit, credit: acc.credit + b.credit }), { debit: 0, credit: 0 }),
    [trialBalanceRows],
  );

  // P&L: revenue and expense accounts
  const revenueRows = useMemo(() => balances.filter((b) => b.type === "revenue" && b.balance !== 0), [balances]);
  const expenseRows = useMemo(() => balances.filter((b) => b.type === "expense" && b.balance !== 0), [balances]);
  const totalRevenue = useMemo(() => revenueRows.reduce((sum, r) => sum + r.balance, 0), [revenueRows]);
  const totalExpenses = useMemo(() => expenseRows.reduce((sum, r) => sum + r.balance, 0), [expenseRows]);
  const netProfit = totalRevenue - totalExpenses;

  // Balance Sheet: assets, liabilities, equity
  const assetRows = useMemo(() => balances.filter((b) => b.type === "asset" && b.balance !== 0), [balances]);
  const liabilityRows = useMemo(() => balances.filter((b) => b.type === "liability" && b.balance !== 0), [balances]);
  const equityRows = useMemo(() => balances.filter((b) => b.type === "equity" && b.balance !== 0), [balances]);
  const totalAssets = useMemo(() => assetRows.reduce((sum, r) => sum + r.balance, 0), [assetRows]);
  const totalLiabilities = useMemo(() => liabilityRows.reduce((sum, r) => sum + r.balance, 0), [liabilityRows]);
  const totalEquityBase = useMemo(() => equityRows.reduce((sum, r) => sum + r.balance, 0), [equityRows]);
  // Retained earnings for the sheet = net profit not yet formally closed to equity
  const totalEquity = totalEquityBase + netProfit;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
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
          </TabsList>

          <TabsContent value="trial-balance">
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance</CardTitle>
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
                      <tr key={row.code} className="border-b">
                        <td className="py-2">{row.code}</td>
                        <td className="py-2">{row.name}</td>
                        <td className="py-2 text-right">{row.debit > 0 ? row.debit.toFixed(2) : ""}</td>
                        <td className="py-2 text-right">{row.credit > 0 ? row.credit.toFixed(2) : ""}</td>
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
                {Math.abs(trialBalanceTotals.debit - trialBalanceTotals.credit) > 0.01 && (
                  <p className="mt-3 text-sm text-red-600">
                    Warning: totals do not match — this should never happen given the ledger's constraints.
                    Flag this immediately if you see it.
                  </p>
                )}
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
                  <span className={netProfit >= 0 ? "text-green-700" : "text-red-700"}>{netProfit.toFixed(2)}</span>
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
                  <span className={Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "text-green-700" : "text-red-700"}>
                    {totalAssets.toFixed(2)} {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "=" : "≠"}{" "}
                    {(totalLiabilities + totalEquity).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}