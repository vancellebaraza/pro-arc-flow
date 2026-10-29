import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAudit } from "@/lib/auditLog";
import { getUserCached } from "@/lib/auth-cache";
import { CsvButton } from "@/components/accountant/CsvButton";
import { ConfirmDialog } from "@/components/accountant/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/accountant/bills")({
  component: BillsPage,
});

interface VendorOption {
  id: string;
  name: string;
}

interface AccountOption {
  id: string;
  name: string;
  code: string;
}

interface BillRecord {
  id: string;
  vendor_id: string;
  vendor_name?: string;
  description: string;
  bill_number: string | null;
  status: string;
  amount: number;
  bill_date: string;
  expense_account_id: string;
}

function BillsPage() {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<AccountOption[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approveTarget, setApproveTarget] = useState<BillRecord | null>(null);
  const [approving, setApproving] = useState(false);
  // Synchronous lock so a double click cannot approve (and post) the same bill twice.
  const approveInFlight = useRef(false);

  const [vendorId, setVendorId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("id,name")
      .order("name");

    if (vendorError) {
      toast.error(vendorError.message);
    } else {
      setVendors(vendorData ?? []);
    }

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("id,name,code")
      .eq("type", "expense")
      .eq("is_active", true)
      .order("code");

    if (accountError) {
      toast.error(accountError.message);
    } else {
      setExpenseAccounts(accountData ?? []);
    }

    const { data: billData, error: billError } = await supabase
      .from("bills")
      .select("id,vendor_id,description,bill_number,status,amount,bill_date,expense_account_id,vendors(name)")
      .order("created_at", { ascending: false });

    if (billError) {
      toast.error(billError.message);
      setLoading(false);
      return;
    }

    const mapped = (billData ?? []).map((b) => ({
      id: b.id,
      vendor_id: b.vendor_id,
      vendor_name: (b.vendors as unknown as { name: string } | null)?.name ?? "Unknown vendor",
      description: b.description,
      bill_number: b.bill_number,
      status: b.status,
      amount: Number(b.amount) || 0,
      bill_date: b.bill_date,
      expense_account_id: b.expense_account_id,
    }));

    setBills(mapped);
    setLoading(false);
  }

  function openCreateDialog() {
    setVendorId("");
    setExpenseAccountId("");
    setDescription("");
    setBillNumber("");
    setAmount("");
    setCreating(true);
  }

  async function handleCreateBill() {
    if (!vendorId || !expenseAccountId || !description.trim() || !amount) {
      toast.error("Vendor, expense account, description, and amount are all required.");
      return;
    }

    const amountNum = Number(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Amount must be a positive number.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await getUserCached();

      const { error } = await supabase.from("bills").insert({
        vendor_id: vendorId,
        expense_account_id: expenseAccountId,
        description: description.trim(),
        bill_number: billNumber.trim() || null,
        amount: amountNum,
        status: "draft",
        created_by: userData.user?.id ?? null,
      });

      if (error) {
        throw error;
      }

      toast.success("Bill created as draft.");
      void logAudit("bills", crypto.randomUUID(), "insert", null, {
        vendor_id: vendorId,
        expense_account_id: expenseAccountId,
        description: description.trim(),
        amount: amountNum,
      });
      setCreating(false);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveBill() {
    if (!approveTarget || approveInFlight.current) return;
    approveInFlight.current = true;
    setApproving(true);
    try {
      const billId = approveTarget.id;
      // Only a draft can be approved; the status filter makes a repeat submit a no-op instead of a re-post.
      const { data, error } = await supabase
        .from("bills")
        .update({ status: "approved" })
        .eq("id", billId)
        .eq("status", "draft")
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("This bill is no longer a draft.");

      toast.success("Bill approved and posted to the ledger.");
      void logAudit("bills", billId, "update", { status: "draft" }, { status: "approved" });
      setApproveTarget(null);
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : String(error));
      setApproveTarget(null);
      await loadData();
    } finally {
      approveInFlight.current = false;
      setApproving(false);
    }
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] font-bold leading-tight">Bills</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Record vendor bills. A draft bill does not affect the ledger — only approving it does.
          </p>
        </div>
        <Button onClick={openCreateDialog}>New bill</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>All bills</CardTitle>
            <CsvButton
              name="bills"
              headers={["Vendor", "Description", "Bill number", "Status", "Bill date", "Amount"]}
              rows={bills.map((b) => [b.vendor_name, b.description, b.bill_number, b.status, b.bill_date, b.amount])}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : bills.length === 0 ? (
            <div className="text-sm text-muted-foreground">No bills recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {bills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">
                      {bill.vendor_name} — {bill.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bill.status} • Amount: {bill.amount.toFixed(2)} • {new Date(bill.bill_date).toLocaleDateString()}
                      {bill.bill_number ? ` • Ref: ${bill.bill_number}` : ""}
                    </div>
                  </div>
                  {bill.status === "draft" ? (
                    <Button variant="outline" onClick={() => setApproveTarget(bill)}>
                      Approve bill
                    </Button>
                  ) : (
                    <span className="text-sm capitalize text-muted-foreground">{bill.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={approveTarget !== null}
        title="Approve bill and post to the ledger?"
        description={`${approveTarget?.vendor_name ?? ""} - ${approveTarget?.description ?? ""} for ${Number(approveTarget?.amount ?? 0).toFixed(2)} will be posted to the general ledger (expense and Accounts Payable).`}
        confirmLabel="Approve and post"
        busy={approving}
        onConfirm={() => void handleApproveBill()}
        onCancel={() => setApproveTarget(null)}
      />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New bill</DialogTitle>
            <DialogDescription>
              A bill records money owed to a vendor. It won't affect the ledger until approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expense account</Label>
              <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose expense category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Parts delivery for Manhole Repair job"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill/reference number (optional)</Label>
              <Input id="billNumber" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button onClick={handleCreateBill} disabled={saving} className="w-full">
              {saving ? "Creating…" : "Create as draft"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}