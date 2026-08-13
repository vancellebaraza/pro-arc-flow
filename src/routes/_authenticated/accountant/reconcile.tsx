import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/reconcile")({
  component: ReconcilePage,
});

interface BankAccountOption {
  id: string;
  bank_name: string;
  account_name: string;
  account_id: string;
  opening_balance: number;
}

interface BankTxn {
  id: string;
  txn_date: string;
  description: string;
  amount: number;
}

interface LedgerLine {
  id: string;
  journal_entry_id: string;
  amount: number;
  entry_date: string;
  description: string;
}

interface MatchedPair {
  matchId: string;
  txn: BankTxn;
  line: LedgerLine;
  amountsDiffer: boolean;
}

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ReconcilePage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
  const [unmatchedTxns, setUnmatchedTxns] = useState<BankTxn[]>([]);
  const [unmatchedLines, setUnmatchedLines] = useState<LedgerLine[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    void loadBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedBankAccountId) {
      void loadReconciliationData(selectedBankAccountId);
    } else {
      setUnmatchedTxns([]);
      setUnmatchedLines([]);
      setMatchedPairs([]);
    }
    setSelectedTxnId(null);
    setSelectedLineId(null);
  }, [selectedBankAccountId]);

  async function loadBankAccounts() {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("id,bank_name,account_name,account_id,opening_balance")
      .eq("is_active", true)
      .order("bank_name");

    if (error) {
      toast.error(error.message);
      return;
    }

    const rows = (data ?? []).map((b) => ({ ...b, opening_balance: Number(b.opening_balance) || 0 }));
    setBankAccounts(rows);
  }

  async function loadReconciliationData(bankAccountId: string) {
    setLoading(true);

    const bankAccount = bankAccounts.find((b) => b.id === bankAccountId);
    if (!bankAccount) {
      setLoading(false);
      return;
    }

    const { data: allTxns, error: txnError } = await supabase
      .from("bank_transactions")
      .select("id,txn_date,description,amount")
      .eq("bank_account_id", bankAccountId);

    if (txnError) {
      toast.error(txnError.message);
      setLoading(false);
      return;
    }

    const { data: allLinesRaw, error: lineError } = await supabase
      .from("journal_lines")
      .select("id,journal_entry_id,debit,credit")
      .eq("account_id", bankAccount.account_id);

    if (lineError) {
      toast.error(lineError.message);
      setLoading(false);
      return;
    }

    const entryIds = [...new Set((allLinesRaw ?? []).map((l) => l.journal_entry_id))];
    const { data: entries, error: entryError } =
      entryIds.length > 0
        ? await supabase.from("journal_entries").select("id,entry_date,description").in("id", entryIds)
        : { data: [], error: null };

    if (entryError) {
      toast.error(entryError.message);
      setLoading(false);
      return;
    }

    const entryMap = new Map((entries ?? []).map((e) => [e.id, e]));

    const allLines: LedgerLine[] = (allLinesRaw ?? []).map((l) => {
      const entry = entryMap.get(l.journal_entry_id);
      return {
        id: l.id,
        journal_entry_id: l.journal_entry_id,
        amount: (Number(l.debit) || 0) - (Number(l.credit) || 0),
        entry_date: entry?.entry_date ?? "",
        description: entry?.description ?? "(no description)",
      };
    });

    const txnIds = (allTxns ?? []).map((t) => t.id);
    const lineIds = allLines.map((l) => l.id);

    const { data: matches, error: matchError } = await supabase
      .from("reconciliation_matches")
      .select("id,bank_transaction_id,journal_line_id");

    if (matchError) {
      toast.error(matchError.message);
      setLoading(false);
      return;
    }

    const relevantMatches = (matches ?? []).filter(
      (m) => txnIds.includes(m.bank_transaction_id) || lineIds.includes(m.journal_line_id),
    );

    const matchedTxnIds = new Set(relevantMatches.map((m) => m.bank_transaction_id));
    const matchedLineIds = new Set(relevantMatches.map((m) => m.journal_line_id));

    const txnMap = new Map((allTxns ?? []).map((t) => [t.id, t]));
    const lineMap = new Map(allLines.map((l) => [l.id, l]));

    const pairs: MatchedPair[] = relevantMatches
      .map((m) => {
        const txn = txnMap.get(m.bank_transaction_id);
        const line = lineMap.get(m.journal_line_id);
        if (!txn || !line) return null;
        return {
          matchId: m.id,
          txn,
          line,
          amountsDiffer: Math.abs(txn.amount - line.amount) > 0.01,
        };
      })
      .filter((p): p is MatchedPair => p !== null);

    setUnmatchedTxns((allTxns ?? []).filter((t) => !matchedTxnIds.has(t.id)));
    setUnmatchedLines(allLines.filter((l) => !matchedLineIds.has(l.id)));
    setMatchedPairs(pairs);
    setLoading(false);
  }

  const suggestedLineIds = useMemo(() => {
    if (!selectedTxnId) return new Set<string>();
    const txn = unmatchedTxns.find((t) => t.id === selectedTxnId);
    if (!txn) return new Set<string>();
    return new Set(unmatchedLines.filter((l) => Math.abs(l.amount - txn.amount) < 0.01).map((l) => l.id));
  }, [selectedTxnId, unmatchedTxns, unmatchedLines]);

  async function handleMatch() {
    if (!selectedTxnId || !selectedLineId) return;

    const txn = unmatchedTxns.find((t) => t.id === selectedTxnId);
    if (!txn) return;

    setMatching(true);

    const { error } = await supabase.from("reconciliation_matches").insert({
      bank_transaction_id: selectedTxnId,
      journal_line_id: selectedLineId,
      matched_amount: txn.amount,
    });

    if (error) {
      toast.error(error.message);
      setMatching(false);
      return;
    }

    toast.success("Matched");
    setSelectedTxnId(null);
    setSelectedLineId(null);
    setMatching(false);
    await loadReconciliationData(selectedBankAccountId);
  }

  async function handleUnmatch(matchId: string) {
    const { error } = await supabase.from("reconciliation_matches").delete().eq("id", matchId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Match removed");
    await loadReconciliationData(selectedBankAccountId);
  }

  const selectedBankAccount = bankAccounts.find((b) => b.id === selectedBankAccountId);
  const reconciledTotal = matchedPairs.reduce((s, p) => s + p.txn.amount, 0);
  const reconciledBalance = (selectedBankAccount?.opening_balance ?? 0) + reconciledTotal;
  const unmatchedTxnTotal = unmatchedTxns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Reconcile</h1>
        <p className="mt-1 text-muted-foreground">
          Match imported bank transactions against ledger entries for the same account.
        </p>
      </div>

      <div className="mt-6 max-w-md space-y-2">
        <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a bank account to reconcile" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.bank_name} - {b.account_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBankAccountId && !loading && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Reconciled balance</div>
              <div className="mt-1 text-lg font-semibold">{formatKes(reconciledBalance)}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Unmatched bank transactions</div>
              <div className="mt-1 text-lg font-semibold">
                {unmatchedTxns.length} ({formatKes(unmatchedTxnTotal)})
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Unmatched ledger entries</div>
              <div className="mt-1 text-lg font-semibold">{unmatchedLines.length}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => void handleMatch()} disabled={!selectedTxnId || !selectedLineId || matching}>
              {matching ? "Matching…" : "Match selected"}
            </Button>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card">
              <div className="border-b p-3 text-sm font-medium">Bank transactions ({unmatchedTxns.length})</div>
              <div className="max-h-[420px] divide-y overflow-auto">
                {unmatchedTxns.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Nothing unmatched.</div>
                ) : (
                  unmatchedTxns.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTxnId(t.id === selectedTxnId ? null : t.id)}
                      className={`block w-full p-3 text-left text-sm hover:bg-accent ${
                        selectedTxnId === t.id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{t.txn_date}</span>
                        <span className={t.amount < 0 ? "text-red-700" : "text-emerald-700"}>
                          {t.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-muted-foreground">{t.description}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="border-b p-3 text-sm font-medium">Ledger entries ({unmatchedLines.length})</div>
              <div className="max-h-[420px] divide-y overflow-auto">
                {unmatchedLines.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Nothing unmatched.</div>
                ) : (
                  unmatchedLines.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLineId(l.id === selectedLineId ? null : l.id)}
                      className={`block w-full p-3 text-left text-sm hover:bg-accent ${
                        selectedLineId === l.id ? "bg-accent" : ""
                      } ${suggestedLineIds.has(l.id) && selectedLineId !== l.id ? "bg-amber-50" : ""}`}
                    >
                      <div className="flex justify-between">
                        <span>{l.entry_date}</span>
                        <span className={l.amount < 0 ? "text-red-700" : "text-emerald-700"}>
                          {l.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-muted-foreground">
                        {l.description}
                        {suggestedLineIds.has(l.id) && selectedLineId !== l.id && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            Suggested
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {matchedPairs.length > 0 && (
            <div className="mt-6 rounded-lg border bg-card">
              <div className="border-b p-3 text-sm font-medium">Matched ({matchedPairs.length})</div>
              <div className="max-h-[300px] divide-y overflow-auto">
                {matchedPairs.map((p) => (
                  <div key={p.matchId} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div>
                        {p.txn.txn_date} — {p.txn.description} — {p.txn.amount.toFixed(2)}
                      </div>
                      <div className="text-muted-foreground">
                        matched to {p.line.entry_date} — {p.line.description} — {p.line.amount.toFixed(2)}
                        {p.amountsDiffer && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                            Amounts differ
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => void handleUnmatch(p.matchId)}>
                      Undo
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading && <div className="mt-6 text-sm text-muted-foreground">Loading…</div>}
    </div>
  );
}
