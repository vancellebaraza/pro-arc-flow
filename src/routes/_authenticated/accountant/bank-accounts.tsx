import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/bank-accounts")({
  component: BankAccountsPage,
});

interface LedgerAccountOption {
  id: string;
  code: string;
  name: string;
}

interface BankAccountRow {
  id: string;
  account_id: string;
  bank_name: string;
  account_name: string;
  account_number_last4: string | null;
  opening_balance: number;
  opening_balance_date: string;
  is_active: boolean;
  ledger_code: string;
  ledger_name: string;
}

function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountRow | null>(null);
  const [form, setForm] = useState({
    account_id: "",
    bank_name: "",
    account_name: "",
    account_number_last4: "",
    opening_balance: "0",
    opening_balance_date: new Date().toISOString().slice(0, 10),
    is_active: true,
  });

  async function loadData() {
    setLoading(true);

    const { data: accounts, error: acctError } = await supabase
      .from("accounts")
      .select("id,code,name")
      .eq("type", "asset")
      .eq("is_active", true)
      .order("code");

    if (acctError) {
      toast.error(acctError.message);
      setLoading(false);
      return;
    }

    setLedgerAccounts(accounts ?? []);
    const ledgerMap = new Map((accounts ?? []).map((a) => [a.id, a]));

    const { data: bankAccts, error: bankError } = await supabase
      .from("bank_accounts")
      .select("id,account_id,bank_name,account_name,account_number_last4,opening_balance,opening_balance_date,is_active")
      .order("bank_name");

    if (bankError) {
      toast.error(bankError.message);
      setLoading(false);
      return;
    }

    const rows: BankAccountRow[] = (bankAccts ?? []).map((b) => {
      const ledger = ledgerMap.get(b.account_id);
      return {
        id: b.id,
        account_id: b.account_id,
        bank_name: b.bank_name,
        account_name: b.account_name,
        account_number_last4: b.account_number_last4,
        opening_balance: Number(b.opening_balance) || 0,
        opening_balance_date: b.opening_balance_date,
        is_active: b.is_active,
        ledger_code: ledger?.code ?? "—",
        ledger_name: ledger?.name ?? "Unknown account",
      };
    });

    setBankAccounts(rows);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setEditing(null);
    setForm({
      account_id: "",
      bank_name: "",
      account_name: "",
      account_number_last4: "",
      opening_balance: "0",
      opening_balance_date: new Date().toISOString().slice(0, 10),
      is_active: true,
    });
  }

  function openNew() {
    resetForm();
    setOpen(true);
  }

  function openEdit(row: BankAccountRow) {
    setEditing(row);
    setForm({
      account_id: row.account_id,
      bank_name: row.bank_name,
      account_name: row.account_name,
      account_number_last4: row.account_number_last4 ?? "",
      opening_balance: String(row.opening_balance),
      opening_balance_date: row.opening_balance_date,
      is_active: row.is_active,
    });
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.account_id || !form.bank_name.trim() || !form.account_name.trim()) {
      toast.error("Linked account, bank name, and account name are required.");
      return;
    }

    const openingBalance = Number(form.opening_balance);
    if (Number.isNaN(openingBalance)) {
      toast.error("Opening balance must be a valid number.");
      return;
    }

    const payload = {
      account_id: form.account_id,
      bank_name: form.bank_name.trim(),
      account_name: form.account_name.trim(),
      account_number_last4: form.account_number_last4.trim() || null,
      opening_balance: openingBalance,
      opening_balance_date: form.opening_balance_date,
      is_active: form.is_active,
    };

    try {
      const request = editing
        ? supabase.from("bank_accounts").update(payload).eq("id", editing.id)
        : supabase.from("bank_accounts").insert(payload);

      const { error } = await request;
      if (error) throw error;

      toast.success(editing ? "Bank account updated" : "Bank account added");
      setOpen(false);
      resetForm();
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Bank Accounts</h1>
          <p className="mt-1 text-muted-foreground">
            Set up bank accounts linked to your ledger, ready for statement import and reconciliation.
          </p>
        </div>
        <Button onClick={openNew}>New bank account</Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Loading…</div>
        ) : bankAccounts.length === 0 ? (
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            No bank accounts set up yet. Add one to start reconciling.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account name</TableHead>
                  <TableHead>Last 4</TableHead>
                  <TableHead>Linked ledger account</TableHead>
                  <TableHead className="text-right">Opening balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.bank_name}</TableCell>
                    <TableCell>{row.account_name}</TableCell>
                    <TableCell>{row.account_number_last4 ?? "—"}</TableCell>
                    <TableCell>
                      {row.ledger_code} - {row.ledger_name}
                    </TableCell>
                    <TableCell className="text-right">{row.opening_balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          row.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit bank account" : "New bank account"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the bank account details below." : "Link a real bank account to a ledger account for reconciliation."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account_id">Linked ledger account</Label>
              <Select
                value={form.account_id}
                onValueChange={(value) => setForm((current) => ({ ...current, account_id: value }))}
              >
                <SelectTrigger id="account_id">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {ledgerAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank name</Label>
                <Input
                  id="bank_name"
                  value={form.bank_name}
                  onChange={(event) => setForm((current) => ({ ...current, bank_name: event.target.value }))}
                  placeholder="e.g. Equity Bank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number_last4">Last 4 digits (optional)</Label>
                <Input
                  id="account_number_last4"
                  value={form.account_number_last4}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, account_number_last4: event.target.value }))
                  }
                  placeholder="e.g. 1234"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account name / label</Label>
              <Input
                id="account_name"
                value={form.account_name}
                onChange={(event) => setForm((current) => ({ ...current, account_name: event.target.value }))}
                placeholder="e.g. Main Operating Account"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opening_balance">Opening balance (KES)</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  value={form.opening_balance}
                  onChange={(event) => setForm((current) => ({ ...current, opening_balance: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opening_balance_date">As of</Label>
                <Input
                  id="opening_balance_date"
                  type="date"
                  value={form.opening_balance_date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, opening_balance_date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border p-3">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active bank account
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save bank account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
