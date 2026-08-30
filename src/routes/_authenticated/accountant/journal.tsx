import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/accountant/journal")({
  component: JournalPage,
});

interface JournalLine {
  id: string;
  account_id: string;
  debit: number;
  credit: number;
  memo: string | null;
}

interface JournalEntry {
  id: string;
  entry_date: string;
  description: string;
  reference: string | null;
  source_type: string | null;
  status: string;
  lines: JournalLine[];
}

interface Account {
  id: string;
  code: string;
  name: string;
}

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accountMap, setAccountMap] = useState<Map<string, Account>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);

    const { data: accounts } = await supabase.from("accounts").select("id,code,name");
    const accMap = new Map<string, Account>();
    for (const a of (accounts ?? []) as Account[]) accMap.set(a.id, a);
    setAccountMap(accMap);

    const { data: entryRows } = await supabase
      .from("journal_entries")
      .select("id,entry_date,description,reference,source_type,status")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);

    const { data: lineRows } = await supabase
      .from("journal_lines")
      .select("id,journal_entry_id,account_id,debit,credit,memo");

    const linesByEntry = new Map<string, JournalLine[]>();
    for (const l of lineRows ?? []) {
      const arr = linesByEntry.get(l.journal_entry_id) ?? [];
      arr.push({
        id: l.id,
        account_id: l.account_id,
        debit: Number(l.debit),
        credit: Number(l.credit),
        memo: l.memo,
      });
      linesByEntry.set(l.journal_entry_id, arr);
    }

    setEntries(
      ((entryRows ?? []) as Array<Omit<JournalEntry, "lines">>).map((e) => ({
        ...e,
        lines: linesByEntry.get(e.id) ?? [],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function accountLabel(accountId: string) {
    const a = accountMap.get(accountId);
    return a ? `${a.code} — ${a.name}` : accountId;
  }

  const filtered = entries.filter((e) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      e.description.toLowerCase().includes(needle) ||
      (e.reference ?? "").toLowerCase().includes(needle) ||
      (e.source_type ?? "").toLowerCase().includes(needle) ||
      e.lines.some((l) => accountLabel(l.account_id).toLowerCase().includes(needle))
    );
  });

  return (
    <div className="p-4 md:p-8 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Journal</h1>
          <p className="text-muted-foreground mt-1">
            Every double-entry posting to the general ledger, most recent first. Click an entry to
            see its debit and credit lines.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search description, ref, account…"
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No journal entries found.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3 w-8"></th>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Source</th>
                <th className="p-3">Reference</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const total = entry.lines.reduce((sum, l) => sum + l.debit, 0);
                const isOpen = expanded.has(entry.id);
                const isBalanced =
                  Math.abs(
                    entry.lines.reduce((s, l) => s + l.debit, 0) -
                      entry.lines.reduce((s, l) => s + l.credit, 0),
                  ) < 0.01;
                return (
                  <Fragment key={entry.id}>
                    <tr
                      className="border-t cursor-pointer hover:bg-surface/60"
                      onClick={() => toggle(entry.id)}
                    >
                      <td className="p-3">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">{entry.entry_date}</td>
                      <td className="p-3">{entry.description}</td>
                      <td className="p-3 text-muted-foreground capitalize">
                        {entry.source_type ?? "—"}
                      </td>
                      <td className="p-3 text-muted-foreground">{entry.reference ?? "—"}</td>
                      <td className="p-3 text-right font-medium">{total.toFixed(2)}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                            isBalanced
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-rose-500/10 text-rose-700"
                          }`}
                        >
                          {isBalanced ? "balanced" : "unbalanced"}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t bg-surface/40">
                        <td colSpan={7} className="p-0">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-muted-foreground">
                                <th className="p-2 pl-12 text-left font-normal">Account</th>
                                <th className="p-2 text-left font-normal">Memo</th>
                                <th className="p-2 text-right font-normal">Debit</th>
                                <th className="p-2 text-right font-normal pr-4">Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.lines.map((line) => (
                                <tr key={line.id} className="border-t border-border/50">
                                  <td className="p-2 pl-12">{accountLabel(line.account_id)}</td>
                                  <td className="p-2 text-muted-foreground">{line.memo ?? "—"}</td>
                                  <td className="p-2 text-right">
                                    {line.debit > 0 ? line.debit.toFixed(2) : ""}
                                  </td>
                                  <td className="p-2 text-right pr-4">
                                    {line.credit > 0 ? line.credit.toFixed(2) : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
