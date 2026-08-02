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

export const Route = createFileRoute("/_authenticated/accountant/accounts")({
  component: AccountsPage,
});

interface AccountRow {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
}

const accountTypeOrder = ["asset", "liability", "equity", "revenue", "expense"] as const;
const accountTypeLabels: Record<string, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "asset" as string,
    parent_id: null as string | null,
    is_active: true,
  });

  async function loadAccounts() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("accounts")
      .select("id,code,name,type,parent_id,is_active")
      .order("code", { ascending: true });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setAccounts((data ?? []) as AccountRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  const parentOptions = useMemo(
    () => accounts.filter((account) => account.is_active && account.id !== editingAccount?.id),
    [accounts, editingAccount],
  );

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountRow[]> = {};

    accountTypeOrder.forEach((type) => {
      groups[type] = accounts.filter((account) => account.type === type).sort((a, b) => a.code.localeCompare(b.code));
    });

    return groups;
  }, [accounts]);

  function resetForm() {
    setEditingAccount(null);
    setForm({
      code: "",
      name: "",
      type: "asset",
      parent_id: null,
      is_active: true,
    });
  }

  function openNewAccount() {
    resetForm();
    setOpen(true);
  }

  function openEditAccount(account: AccountRow) {
    setEditingAccount(account);
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      parent_id: account.parent_id,
      is_active: account.is_active,
    });
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and account name are required.");
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      parent_id: form.parent_id || null,
      is_active: form.is_active,
    };

    try {
      const request = editingAccount
        ? (supabase as any).from("accounts").update(payload).eq("id", editingAccount.id)
        : (supabase as any).from("accounts").insert(payload);

      const { error } = await request;
      if (error) {
        throw error;
      }

      toast.success(editingAccount ? "Account updated" : "Account created");
      setOpen(false);
      resetForm();
      await loadAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Chart of Accounts</h1>
          <p className="mt-1 text-muted-foreground">
            Manage accounts, assign parent accounts where relevant, and toggle active status without deleting records.
          </p>
        </div>
        <Button onClick={openNewAccount}>New account</Button>
      </div>

      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Loading accounts…</div>
        ) : (
          accountTypeOrder.map((type) => {
            const groupAccounts = groupedAccounts[type];
            if (groupAccounts.length === 0) {
              return null;
            }

            return (
              <section key={type} className="rounded-lg border bg-card p-4">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-semibold capitalize">{accountTypeLabels[type] ?? type}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {groupAccounts.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.code}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>{accountTypeLabels[account.type] ?? account.type}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                account.is_active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {account.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => openEditAccount(account)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit account" : "New account"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Update the account details below." : "Add a new account to the chart of accounts."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="e.g. 1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypeOrder.map((value) => (
                      <SelectItem key={value} value={value}>
                        {accountTypeLabels[value] ?? value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Cash at bank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent account</Label>
              <Select
                value={form.parent_id ?? "none"}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, parent_id: value === "none" ? null : value }))
                }
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="No parent account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent account</SelectItem>
                  {parentOptions.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 rounded-md border p-3">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active account
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
