import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/auditLog";

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

interface DraftLine {
  account_id: string;
  debit: string;
  credit: string;
  memo: string;
}

function emptyLine(): DraftLine {
  return { account_id: "", debit: "", credit: "", memo: "" };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountMap, setAccountMap] = useState<Map<string, Account>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entryDate, setEntryDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()]);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: accountRows } = await supabase
      .from("accounts")
      .select("id,code,name")
      .order("code", { ascending: true });
    const accList = (accountRows ?? []) as Account[];
    setAccounts(accList);
    const accMap = new Map<string, Account>();
    for (const a of accList) accMap.set(a.id, a);
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

  function resetForm() {
    setEntryDate(todayISO());
    setDescription("");
    setReference("");
    setLines([emptyLine(), emptyLine()]);
  }

  function openNewEntry() {
    resetForm();
    setOpen(true);
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    return { debit, credit, diff: Math.round((debit - credit) * 100) / 100 };
  }, [lines]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!description.trim()) {
      toast.error("Description is required.");
      return;
    }

    const cleanLines = lines.filter((l) => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));

    if (cleanLines.length < 2) {
      toast.error("Add at least two lines with an account and an amount.");
      return;
    }

    for (const l of cleanLines) {
      if (Number(l.debit) > 0 && Number(l.credit) > 0) {
        toast.error("A line can't have both a debit and a credit — split it into two lines.");
        return;
      }
    }

    if (totals.diff !== 0) {
      toast.error(`Entry is not balanced. Debits ${totals.debit.toFixed(2)} vs credits ${totals.credit.toFixed(2)}.`);
      return;
    }

    const payload = cleanLines.map((l) => ({
      account_id: l.account_id,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      memo: l.memo.trim() || null,
    }));

    setSubmitting(true);
    try {
      const { data: entryId, error } = await supabase.rpc("create_manual_journal_entry", {
        p_entry_date: entryDate,
        p_description: description.trim(),
        p_reference: reference.trim() || null,
        p_lines: payload,
      });

      if (error) throw error;

      await logAudit("journal_entries", entryId as string, "insert", null, {
        entry_date: entryDate,
        description: description.trim(),
        reference: reference.trim() || null,
        source_type: "manual",
        lines: payload,
      });

      toast.success("Journal entry posted.");
      setOpen(false);
      resetForm();
      await load();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search description, ref, account…"
              className="pl-8"
            />
          </div>
          <Button onClick={openNewEntry}>
            <Plus className="h-4 w-4 mr-2" />
            New entry
          </Button>
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

      <Dialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New journal entry</DialogTitle>
            <DialogDescription>
              Post a manual double-entry transaction — payroll, adjustments, opening balances, and
              anything else that doesn't come from an invoice or bill. Debits must equal credits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Reference (optional)</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Payroll — September 2026"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. September 2026 staff payroll"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lines</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add line
                </Button>
              </div>

              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_1fr_32px] gap-2 items-start rounded-md border p-2"
                  >
                    <Select
                      value={line.account_id}
                      onValueChange={(value) => updateLine(index, { account_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Debit"
                      value={line.debit}
                      onChange={(e) => updateLine(index, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Credit"
                      value={line.credit}
                      onChange={(e) => updateLine(index, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                    />
                    <Input
                      placeholder="Memo (optional)"
                      value={line.memo}
                      onChange={(e) => updateLine(index, { memo: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={lines.length <= 2}
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  totals.diff === 0
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-rose-500/10 text-rose-700"
                }`}
              >
                <span>Debits: {totals.debit.toFixed(2)}</span>
                <span>Credits: {totals.credit.toFixed(2)}</span>
                <span>{totals.diff === 0 ? "Balanced" : `Out by ${Math.abs(totals.diff).toFixed(2)}`}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || totals.diff !== 0}>
                {submitting ? "Posting…" : "Post entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
