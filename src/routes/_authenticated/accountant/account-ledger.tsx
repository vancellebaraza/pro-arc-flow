import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { downloadCsvFile, localDateStamp, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/accountant/account-ledger")({
  validateSearch: (search: Record<string, unknown>): { account?: string } => ({
    account: typeof search.account === "string" && search.account ? search.account : undefined,
  }),
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

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function AccountLedgerPage() {
  const { account } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedId, setSelectedId] = useState(account ?? "");
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    void loadAccounts();
  }, []);

  // Deep links (?account=) win over the local selection.
  useEffect(() => {
    if (account) setSelectedId(account);
  }, [account]);

  async function loadAccounts() {
    // Not filtered by is_active so a deep link to an inactive account still resolves.
    const { data, error } = await supabase.from("accounts").select("id,code,name").order("code");
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

    const { data: lines, error } = await supabase
      .from("journal_lines")
      .select("debit,credit,journal_entry_id,journal_entries(description,entry_date,created_at)")
      .eq("account_id", accountId);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const sorted = (lines ?? [])
      .map((l) => {
        const je = l.journal_entries as unknown as { description: string; entry_date: string; created_at: string } | null;
        return {
          date: je?.entry_date ?? je?.created_at ?? "",
          created: je?.created_at ?? "",
          description: je?.description ?? "",
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        };
      })
      .sort((a, b) => a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)) || a.created.localeCompare(b.created));

    // Running balance is debit minus credit across the full history, so a date filter
    // shows the true balance rather than restarting at zero.
    let running = 0;
    const withRunning: LedgerRow[] = sorted.map((r) => {
      running = round2(running + r.debit - r.credit);
      return { date: r.date, description: r.description, debit: r.debit, credit: r.credit, running };
    });

    setRows(withRunning);
    setLoading(false);
  }

  const selected = accounts.find((a) => a.id === selectedId);

  const { visible, opening } = useMemo(() => {
    const day = (r: LedgerRow) => r.date.slice(0, 10);
    const inRange = rows.filter((r) => (!from || day(r) >= from) && (!to || day(r) <= to));
    const before = from ? rows.filter((r) => day(r) < from) : [];
    return { visible: inRange, opening: before.length ? before[before.length - 1].running : 0 };
  }, [rows, from, to]);

  function exportCsv() {
    const csv = toCsv(
      ["Date", "Description", "Debit", "Credit", "Running balance"],
      [
        ...(from ? [[`Opening balance`, "", "", "", opening]] : []),
        ...visible.map((r) => [r.date.slice(0, 10), r.description, r.debit || "", r.credit || "", r.running]),
      ],
    );
    const code = selected?.code ?? "account";
    downloadCsvFile(`ledger-${code}-${localDateStamp()}.csv`, csv);
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">Account Ledger</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every transaction posted to a single account, oldest first, with a running balance.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          value={selectedId}
          onValueChange={(v) => {
            setSelectedId(v);
            void navigate({ search: { account: v }, replace: true });
          }}
        >
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
        <div className="flex flex-col gap-1">
          <Label htmlFor="ledger-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input id="ledger-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ledger-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input id="ledger-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        {(from || to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear dates
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!selectedId || visible.length === 0}>
          <Download className="mr-1 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle>{selected ? `${selected.code} — ${selected.name}` : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions on this account yet.</div>
            ) : visible.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions in this date range.</div>
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
                  {from && (
                    <tr className="border-b text-muted-foreground">
                      <td className="py-2" colSpan={4}>
                        Opening balance
                      </td>
                      <td className="py-2 text-right font-medium">{opening.toFixed(2)}</td>
                    </tr>
                  )}
                  {visible.map((r, i) => (
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
