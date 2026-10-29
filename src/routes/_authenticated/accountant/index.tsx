import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllRows,
  formatKes,
  loadAging,
  loadLedgerSums,
  netOf,
  round2,
  type AgingRow,
} from "@/lib/accounting";

export const Route = createFileRoute("/_authenticated/accountant/")({
  component: AccountantDashboardPage,
});

const STALE = 30_000;
const CARD = "rounded-card border bg-card shadow-[var(--shadow-card)] p-5";

// ---------------------------------------------------------------- queries
// One query per section, so a slow one never blocks the others. Cards that need the same data share a key.

const useLedger = () =>
  useQuery({ queryKey: ["acct-dash", "ledger"], queryFn: loadLedgerSums, staleTime: STALE });

const useAgeing = () =>
  useQuery({ queryKey: ["acct-dash", "ageing"], queryFn: loadAging, staleTime: STALE });

/** Overdue invoices: same cache entry as the ageing strip, reduced to a count and total. */
function useOverdueInvoices() {
  return useQuery({
    queryKey: ["acct-dash", "ageing"],
    queryFn: loadAging,
    staleTime: STALE,
    select: (d): CountTotal =>
      sumRows(d.ar.filter((r) => r.bucket !== "current").map((r) => ({ n: r.remaining }))),
  });
}

function monthBounds(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  const start = `${now.getFullYear()}-${p(now.getMonth() + 1)}-01`;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = `${next.getFullYear()}-${p(next.getMonth() + 1)}-01`; // exclusive
  return { start, end };
}

/** Revenue and expenses for the current month: lines are filtered to the month by the query itself. */
function useMonth() {
  const { start, end } = monthBounds();
  return useQuery({
    queryKey: ["acct-dash", "month", start],
    staleTime: STALE,
    queryFn: async () => {
      const [{ data: accounts, error }, lines] = await Promise.all([
        supabase.from("accounts").select("id,type").in("type", ["revenue", "expense"]),
        fetchAllRows<{ account_id: string; debit: number | string; credit: number | string }>(
          (from, to) =>
            supabase
              .from("journal_lines")
              .select("account_id,debit,credit,journal_entries!inner(entry_date)")
              .gte("journal_entries.entry_date", start)
              .lt("journal_entries.entry_date", end)
              .order("id")
              .range(from, to),
        ),
      ]);
      if (error) throw new Error(error.message);
      const typeOf = new Map((accounts ?? []).map((a) => [a.id, a.type as string]));
      // Net per account type = debit - credit. Expenses are shown as that net, revenue as its negative.
      let revenueNet = 0;
      let expenseNet = 0;
      for (const l of lines) {
        const net = (Number(l.debit) || 0) - (Number(l.credit) || 0);
        const t = typeOf.get(l.account_id);
        if (t === "revenue") revenueNet += net;
        else if (t === "expense") expenseNet += net;
      }
      return { revenue: round2(-revenueNet), expenses: round2(expenseNet) };
    },
  });
}

interface CountTotal {
  count: number;
  total: number;
}

const sumRows = (rows: Array<{ n: number | string | null }>): CountTotal => ({
  count: rows.length,
  total: round2(rows.reduce((s, r) => s + (Number(r.n) || 0), 0)),
});

/** Approved quotations that still have no invoice, ignoring ones flagged do-not-invoice. */
function useQuotationsToInvoice() {
  return useQuery({
    queryKey: ["acct-dash", "to-invoice"],
    staleTime: STALE,
    queryFn: async (): Promise<CountTotal> => {
      const [{ data: quotes, error }, invoiced] = await Promise.all([
        supabase
          .from("quotations")
          .select("id,grand_total")
          .eq("status", "approved")
          .eq("do_not_invoice", false),
        fetchAllRows<{ quotation_id: string }>((from, to) =>
          supabase
            .from("invoices")
            .select("quotation_id")
            .neq("status", "void")
            .order("id")
            .range(from, to),
        ),
      ]);
      if (error) throw new Error(error.message);
      const done = new Set(invoiced.map((i) => i.quotation_id));
      return sumRows(
        (quotes ?? []).filter((q) => !done.has(q.id)).map((q) => ({ n: q.grand_total })),
      );
    },
  });
}

function useDraftInvoices() {
  return useQuery({
    queryKey: ["acct-dash", "draft-invoices"],
    staleTime: STALE,
    queryFn: async (): Promise<CountTotal> => {
      const { data, error } = await supabase.from("invoices").select("total").eq("status", "draft");
      if (error) throw new Error(error.message);
      return sumRows((data ?? []).map((r) => ({ n: r.total })));
    },
  });
}

function useDraftBills() {
  return useQuery({
    queryKey: ["acct-dash", "draft-bills"],
    staleTime: STALE,
    queryFn: async (): Promise<CountTotal> => {
      const { data, error } = await supabase.from("bills").select("amount").eq("status", "draft");
      if (error) throw new Error(error.message);
      return sumRows((data ?? []).map((r) => ({ n: r.amount })));
    },
  });
}

/** Bank transactions with no reconciliation match. There is no anti-join in the API, so both id lists are read. */
function useUnreconciled() {
  return useQuery({
    queryKey: ["acct-dash", "unreconciled"],
    staleTime: STALE,
    queryFn: async (): Promise<CountTotal> => {
      const [txns, matches] = await Promise.all([
        fetchAllRows<{ id: string; amount: number | string }>((from, to) =>
          supabase.from("bank_transactions").select("id,amount").order("id").range(from, to),
        ),
        fetchAllRows<{ bank_transaction_id: string }>((from, to) =>
          supabase
            .from("reconciliation_matches")
            .select("bank_transaction_id")
            .order("id")
            .range(from, to),
        ),
      ]);
      const matched = new Set(matches.map((m) => m.bank_transaction_id));
      return sumRows(
        txns.filter((t) => !matched.has(t.id)).map((t) => ({ n: Math.abs(Number(t.amount) || 0) })),
      );
    },
  });
}

function useRecentPayments() {
  return useQuery({
    queryKey: ["acct-dash", "recent-payments"],
    staleTime: STALE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id,amount,received_date,method,client_display_name")
        .is("voided_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

function useRecentEntries() {
  return useQuery({
    queryKey: ["acct-dash", "recent-entries"],
    staleTime: STALE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("id,entry_date,description,reference")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------- building blocks

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className={CARD}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-6 w-32" />
      <Skeleton className="mt-2 h-4 w-20" />
    </div>
  );
}

function ErrorNote({ q }: { q: UseQueryResult<unknown, Error> }) {
  return (
    <p className="text-sm text-red-700">
      Could not load.{" "}
      <button type="button" className="underline" onClick={() => void q.refetch()}>
        Retry
      </button>
    </p>
  );
}

interface StatProps {
  title: string;
  sub: string;
  value: string | null;
  loading: boolean;
  error?: UseQueryResult<unknown, Error>;
  tone?: "default" | "bad";
  link: ReactNode;
}

function StatCard({ title, sub, value, loading, error, tone, link }: StatProps) {
  if (loading) return <CardSkeleton />;
  return (
    <div className={`${CARD} relative transition-colors hover:bg-accent`}>
      {link}
      <div className="text-sm text-muted-foreground">{title}</div>
      {error?.isError ? (
        <div className="relative z-10 mt-3">
          <ErrorNote q={error} />
        </div>
      ) : (
        <>
          <div className={`mt-3 text-xl font-semibold ${tone === "bad" ? "text-red-700" : ""}`}>
            {value}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- sections

function MoneyCards() {
  const ledger = useLedger();
  const ageing = useAgeing();
  const month = useMonth();

  const L = ledger.data;
  const overdue = ageing.data?.ar.filter((r) => r.bucket !== "current") ?? [];
  const overdueTotal = round2(overdue.reduce((s, r) => s + r.remaining, 0));

  const stretch = "absolute inset-0 rounded-card";
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Cash and bank"
        sub="Accounts 10xx, net"
        loading={ledger.isPending}
        error={ledger}
        value={L ? formatKes(netOf(L, (c) => c.startsWith("10"))) : null}
        link={
          <Link
            to="/accountant/reports"
            search={{ tab: "balance-sheet" }}
            className={stretch}
            aria-label="Cash and bank"
          />
        }
      />
      <StatCard
        title="Receivables"
        sub="Account 1100, net"
        loading={ledger.isPending}
        error={ledger}
        value={L ? formatKes(netOf(L, (c) => c === "1100")) : null}
        link={<Link to="/accountant/payments" className={stretch} aria-label="Receivables" />}
      />
      <StatCard
        title="Payables"
        sub="Account 2000, net owed"
        loading={ledger.isPending}
        error={ledger}
        value={L ? formatKes(-netOf(L, (c) => c === "2000")) : null}
        link={<Link to="/accountant/vendor-payments" className={stretch} aria-label="Payables" />}
      />
      <StatCard
        title="Overdue receivables"
        sub={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"} past due`}
        loading={ageing.isPending}
        error={ageing}
        tone={overdueTotal > 0 ? "bad" : "default"}
        value={formatKes(overdueTotal)}
        link={
          <Link
            to="/accountant/reports"
            search={{ tab: "aging" }}
            className={stretch}
            aria-label="Overdue receivables"
          />
        }
      />
      <StatCard
        title="Revenue this month"
        sub="Net, revenue accounts"
        loading={month.isPending}
        error={month}
        value={month.data ? formatKes(month.data.revenue) : null}
        link={
          <Link
            to="/accountant/reports"
            search={{ tab: "pl" }}
            className={stretch}
            aria-label="Revenue this month"
          />
        }
      />
      <StatCard
        title="Expenses this month"
        sub="Net, expense accounts"
        loading={month.isPending}
        error={month}
        value={month.data ? formatKes(month.data.expenses) : null}
        link={
          <Link
            to="/accountant/reports"
            search={{ tab: "pl" }}
            className={stretch}
            aria-label="Expenses this month"
          />
        }
      />
      <StatCard
        title="VAT payable"
        sub="Account 2100, net owed"
        loading={ledger.isPending}
        error={ledger}
        value={L ? formatKes(-netOf(L, (c) => c === "2100")) : null}
        link={
          <Link
            to="/accountant/reports"
            search={{ tab: "balance-sheet" }}
            className={stretch}
            aria-label="VAT payable"
          />
        }
      />
      <BooksCheck />
    </div>
  );
}

function BooksCheck() {
  const ledger = useLedger();
  if (ledger.isPending) return <CardSkeleton />;
  const diff = ledger.data ? round2(ledger.data.totalDebit - ledger.data.totalCredit) : 0;
  const balanced = diff === 0;
  return (
    <div className={`${CARD} relative transition-colors hover:bg-accent`}>
      <Link
        to="/accountant/reports"
        search={{ tab: "trial-balance" }}
        className="absolute inset-0 rounded-card"
        aria-label="Trial balance"
      />
      <div className="text-sm text-muted-foreground">Books check</div>
      {ledger.isError ? (
        <div className="relative z-10 mt-3">
          <ErrorNote q={ledger} />
        </div>
      ) : (
        <>
          <div className="mt-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                balanced ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
              }`}
            >
              {balanced ? "Balanced" : `Out by ${formatKes(Math.abs(diff))}`}
            </span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Total debits vs credits</div>
        </>
      )}
    </div>
  );
}

function AttentionRow({
  label,
  q,
  to,
}: {
  label: string;
  q: UseQueryResult<CountTotal, Error>;
  to:
    | "/accountant/invoices"
    | "/accountant/payments"
    | "/accountant/bills"
    | "/accountant/reconcile";
}) {
  if (q.isPending) return <Skeleton className="h-12 w-full" />;
  if (q.isError) {
    return (
      <div className="rounded-lg border p-3">
        <span className="text-sm">{label}: </span>
        <ErrorNote q={q} />
      </div>
    );
  }
  if (q.data.count === 0) return null;
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
    >
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">
          {q.data.count} item{q.data.count === 1 ? "" : "s"}
        </div>
      </div>
      <div className="font-semibold">{formatKes(q.data.total)}</div>
    </Link>
  );
}

function NeedsAttention() {
  const toInvoice = useQuotationsToInvoice();
  const drafts = useDraftInvoices();
  const bills = useDraftBills();
  const unrec = useUnreconciled();

  const overdue = useOverdueInvoices();

  const all = [toInvoice, drafts, overdue, bills, unrec];
  const settled = all.every((q) => !q.isPending);
  const allClear = settled && all.every((q) => q.isError === false && (q.data?.count ?? 0) === 0);

  return (
    <section className={CARD}>
      <h2 className="font-display text-lg font-bold">Needs attention</h2>
      <div className="mt-3 space-y-2">
        <AttentionRow
          label="Approved quotations not yet invoiced"
          q={toInvoice}
          to="/accountant/invoices"
        />
        <AttentionRow label="Draft invoices" q={drafts} to="/accountant/invoices" />
        <AttentionRow label="Overdue invoices" q={overdue} to="/accountant/payments" />
        <AttentionRow label="Bills awaiting approval" q={bills} to="/accountant/bills" />
        <AttentionRow
          label="Bank transactions not reconciled"
          q={unrec}
          to="/accountant/reconcile"
        />
        {allClear && (
          <p className="text-sm text-muted-foreground">All clear. Nothing needs attention.</p>
        )}
      </div>
    </section>
  );
}

const STRIP = [
  { key: "current", label: "Current", color: "bg-emerald-500/70" },
  { key: "1-30", label: "1-30 days", color: "bg-amber-400/80" },
  { key: "31-60", label: "31-60 days", color: "bg-orange-500/80" },
  { key: "61+", label: "61+ days", color: "bg-red-600/80" },
] as const;

function bucketTotals(rows: AgingRow[]) {
  const t = { current: 0, "1-30": 0, "31-60": 0, "61+": 0 };
  for (const r of rows) {
    const k = r.bucket === "61-90" || r.bucket === "90+" ? "61+" : r.bucket;
    t[k] += r.remaining;
  }
  return t;
}

function AgeingStrip({ title, rows }: { title: string; rows: AgingRow[] }) {
  const t = bucketTotals(rows);
  const total = STRIP.reduce((s, b) => s + t[b.key], 0);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{formatKes(round2(total))}</span>
      </div>
      {total <= 0 ? (
        <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
      ) : (
        <div className="flex h-10 w-full overflow-hidden rounded-md">
          {STRIP.filter((b) => t[b.key] > 0).map((b) => (
            <Link
              key={b.key}
              to="/accountant/reports"
              search={{ tab: "aging" }}
              style={{ width: `${(t[b.key] / total) * 100}%` }}
              className={`${b.color} flex min-w-[2.5rem] items-center justify-center overflow-hidden px-1 text-xs font-medium text-white hover:opacity-90`}
              title={`${b.label}: ${formatKes(round2(t[b.key]))}`}
            >
              <span className="truncate">{b.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Ageing() {
  const q = useAgeing();
  return (
    <section className={CARD}>
      <h2 className="font-display text-lg font-bold">Ageing</h2>
      <div className="mt-3 space-y-5">
        {q.isPending ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : q.isError ? (
          <ErrorNote q={q} />
        ) : (
          <>
            <AgeingStrip title="Receivables" rows={q.data.ar} />
            <AgeingStrip title="Payables" rows={q.data.ap} />
          </>
        )}
      </div>
    </section>
  );
}

function Recent() {
  const payments = useRecentPayments();
  const entries = useRecentEntries();
  return (
    <section className={CARD}>
      <h2 className="font-display text-lg font-bold">Recent activity</h2>
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <div>
          <Link
            to="/accountant/payments"
            className="text-sm font-medium underline-offset-2 hover:underline"
          >
            Latest payments
          </Link>
          <div className="mt-2 space-y-2">
            {payments.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : payments.isError ? (
              <ErrorNote q={payments} />
            ) : payments.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              payments.data.map((p) => (
                <Link
                  key={p.id}
                  to="/accountant/payments"
                  className="flex items-center justify-between rounded-lg border p-2 text-sm hover:bg-accent"
                >
                  <span className="truncate">
                    {p.client_display_name ?? "Payment"}
                    {p.method ? ` via ${p.method}` : ""}
                    <span className="ml-2 text-muted-foreground">
                      {new Date(p.received_date).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="ml-2 shrink-0 font-medium">
                    {formatKes(Number(p.amount) || 0)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
        <div>
          <Link
            to="/accountant/journal"
            className="text-sm font-medium underline-offset-2 hover:underline"
          >
            Latest journal entries
          </Link>
          <div className="mt-2 space-y-2">
            {entries.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : entries.isError ? (
              <ErrorNote q={entries} />
            ) : entries.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No journal entries yet.</p>
            ) : (
              entries.data.map((e) => (
                <Link
                  key={e.id}
                  to="/accountant/journal"
                  className="flex items-center justify-between rounded-lg border p-2 text-sm hover:bg-accent"
                >
                  <span className="truncate">{e.description}</span>
                  <span className="ml-2 shrink-0 text-muted-foreground">{e.entry_date}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountantDashboardPage() {
  return (
    <div className="fade-in">
      <div className="space-y-2">
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">Accounting overview</h1>
        <p className="text-muted-foreground">
          Live figures from the general ledger, invoices, and bills.
        </p>
      </div>

      <MoneyCards />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <NeedsAttention />
        <Ageing />
      </div>

      <div className="mt-6">
        <Recent />
      </div>
    </div>
  );
}
