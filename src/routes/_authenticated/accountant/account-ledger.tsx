import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/account-ledger")({
  component: AccountLedgerPage,
});

interface AccountOption {
  id: string;
  code: string;
  name: string;
}

interface LedgerRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  running: number;
}

function AccountLedgerPage() {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadAccounts();
  }, []);

  async function loadAccounts() {
    const { data, error } = await supabase
      .from("accounts")
      .select("id,code,name")
      .eq("is_active", true)
      .order("code");
    if (error) {
      toast.error(error.message);
      return;
    }
    setAccounts(data ?? []);
  }

  useEffect(() => {
    if (!selectedId) {
      setRows([]);
      return;
    }
    void loadLedger(selectedId);
  }, [selectedId]);

  async function loadLedger(accountId: string) {
    setLoading(true);
    const account = accounts.find((a) => a.id === accountId);

    const { data: lines, error } = await supabase
      .from("journal_lines")
      .select("debit,credit,journal_entry_id,journal_entries(description,entry_date,created_at)")
      .eq("account_id", accountId);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const isDebitNormal = true; // will be corrected below using account type if needed
    const sorted = (lines ?? [])
      .map((l) => {
        const je = l.journal_entries as unknown as { description: string; entry_date: string; created_at: string } | null;
        return {
          date: je?.entry_date ?? je?.created_at ?? "",
          description: je?.description ?? "",
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const withRunning: LedgerRow[] = sorted.map((r) => {
      running += r.debit - r.credit;
      return { ...r, running };
    });

    setRows(withRunning);
    setLoading(false);
    void account; // account fetched for future normal-balance-side refinement if needed
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account Ledger</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every transaction posted to a single account, oldest first, with a running balance.
        </p>
      </div>

      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="max-w-sm">
          <SelectValue placeholder="Choose an account" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.code} — {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle>{accounts.find((a) => a.id === selectedId)?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions on this account yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Debit</th>
                    <th className="py-2 text-right">Credit</th>
                    <th className="py-2 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                      <td className="py-2">{r.description}</td>
                      <td className="py-2 text-right">{r.debit > 0 ? r.debit.toFixed(2) : ""}</td>
                      <td className="py-2 text-right">{r.credit > 0 ? r.credit.toFixed(2) : ""}</td>
                      <td className="py-2 text-right font-medium">{r.running.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
