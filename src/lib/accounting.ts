// Shared accounting reads used by the accountant dashboard and the Reports page.
// The API has PostgREST aggregates disabled, so sums are done here, but only over narrow, paged selects.
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000; // PostgREST caps a response at 1000 rows; without paging, sums silently truncate.
const IN_CHUNK = 100; // Keeps `.in()` URLs short.

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function formatKes(amount: number) {
  // Negating a zero balance gives -0, which would print as "-0.00".
  if (Math.abs(amount) < 0.005) amount = 0;
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Reads every row of a query by walking it in pages. `build` must apply a stable order. */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PageResult<T>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return all;
  }
}

async function inChunks<T>(ids: string[], run: (chunk: string[]) => PageResult<T>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const { data, error } = await run(ids.slice(i, i + IN_CHUNK));
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
  }
  return out;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- ledger sums

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
}

export interface LedgerSums {
  accounts: LedgerAccount[];
  /** account id -> gross debit/credit; callers take debit - credit for the net. */
  sums: Map<string, { debit: number; credit: number }>;
  totalDebit: number;
  totalCredit: number;
}

export async function loadLedgerSums(): Promise<LedgerSums> {
  const [{ data: accounts, error }, lines] = await Promise.all([
    supabase.from("accounts").select("id,code,name,type,is_active").order("code"),
    fetchAllRows<{ account_id: string; debit: number | string; credit: number | string }>(
      (from, to) =>
        supabase
          .from("journal_lines")
          .select("account_id,debit,credit")
          .order("id")
          .range(from, to),
    ),
  ]);
  if (error) throw new Error(error.message);

  const sums = new Map<string, { debit: number; credit: number }>();
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    const d = Number(line.debit) || 0;
    const c = Number(line.credit) || 0;
    const cur = sums.get(line.account_id) ?? { debit: 0, credit: 0 };
    cur.debit += d;
    cur.credit += c;
    sums.set(line.account_id, cur);
    totalDebit += d;
    totalCredit += c;
  }
  return {
    accounts: accounts ?? [],
    sums,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
  };
}

/** Net (debit minus credit) of every account whose code passes `match`. */
export function netOf(ledger: LedgerSums, match: (code: string) => boolean): number {
  let net = 0;
  for (const acc of ledger.accounts) {
    if (!match(acc.code)) continue;
    const s = ledger.sums.get(acc.id);
    if (s) net += s.debit - s.credit;
  }
  return round2(net);
}

// ---------------------------------------------------------------- ageing

export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export interface AgingRow {
  id: string;
  partyId: string;
  party: string;
  dueDate: string | null;
  remaining: number;
  bucket: AgingBucket;
}

export function getAgingBucket(dueDate: string | null, today: string): AgingBucket {
  if (!dueDate || dueDate >= today) return "current";
  const days = Math.floor(
    (new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

/** Open (unpaid) receivables and payables, one row per invoice/bill, with their ageing bucket. */
export async function loadAging(): Promise<{ ar: AgingRow[]; ap: AgingRow[] }> {
  const today = todayISO();

  const [{ data: invoices, error: invError }, { data: bills, error: billError }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id,total,due_date,client_id,client_display_name")
        .in("status", ["sent", "partially_paid"]), // void invoices are excluded by this status list
      supabase
        .from("bills")
        .select("id,amount,due_date,vendor_id")
        .in("status", ["approved", "partially_paid"]),
    ]);
  if (invError) throw new Error(invError.message);
  if (billError) throw new Error(billError.message);

  const invoiceIds = (invoices ?? []).map((i) => i.id);
  const billIds = (bills ?? []).map((b) => b.id);
  const clientIds = [...new Set((invoices ?? []).map((i) => i.client_id).filter(Boolean))];
  const vendorIds = [...new Set((bills ?? []).map((b) => b.vendor_id).filter(Boolean))];

  const [allocs, vendorAllocs, profiles, vendors] = await Promise.all([
    inChunks(invoiceIds, (ids) =>
      supabase
        .from("payment_allocations")
        .select("invoice_id,amount_applied,payments!inner(voided_at)")
        .is("payments.voided_at", null)
        .in("invoice_id", ids),
    ),
    inChunks(billIds, (ids) =>
      supabase
        .from("vendor_payment_allocations")
        .select("bill_id,amount_applied")
        .in("bill_id", ids),
    ),
    inChunks(clientIds, (ids) => supabase.from("profiles").select("id,full_name").in("id", ids)),
    inChunks(vendorIds, (ids) => supabase.from("vendors").select("id,name").in("id", ids)),
  ]);

  const clientNames = new Map(profiles.map((p) => [p.id, p.full_name ?? "Unnamed client"]));
  const vendorNames = new Map(vendors.map((v) => [v.id, v.name]));
  const paid = new Map<string, number>();
  for (const a of allocs)
    paid.set(a.invoice_id, (paid.get(a.invoice_id) ?? 0) + (Number(a.amount_applied) || 0));
  const vendorPaid = new Map<string, number>();
  for (const a of vendorAllocs) {
    vendorPaid.set(a.bill_id, (vendorPaid.get(a.bill_id) ?? 0) + (Number(a.amount_applied) || 0));
  }

  const ar: AgingRow[] = (invoices ?? [])
    .map((inv) => ({
      id: inv.id,
      partyId: inv.client_id,
      party: inv.client_display_name ?? clientNames.get(inv.client_id) ?? "Unknown client",
      dueDate: inv.due_date,
      remaining: (Number(inv.total) || 0) - (paid.get(inv.id) ?? 0),
      bucket: getAgingBucket(inv.due_date, today),
    }))
    .filter((r) => r.remaining > 0.01);

  const ap: AgingRow[] = (bills ?? [])
    .map((b) => ({
      id: b.id,
      partyId: b.vendor_id,
      party: vendorNames.get(b.vendor_id) ?? "Unknown vendor",
      dueDate: b.due_date,
      remaining: (Number(b.amount) || 0) - (vendorPaid.get(b.id) ?? 0),
      bucket: getAgingBucket(b.due_date, today),
    }))
    .filter((r) => r.remaining > 0.01);

  return { ar, ap };
}
