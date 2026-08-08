import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/bank-import")({
  component: BankImportPage,
});

interface BankAccountOption {
  id: string;
  bank_name: string;
  account_name: string;
}

type AmountMode = "signed" | "debit-credit";
type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";

interface ParsedRow {
  date: string | null;
  description: string;
  amount: number;
  raw: Record<string, string>;
  isDuplicate: boolean;
  isValid: boolean;
}

function parseDate(value: string, format: DateFormat): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (format === "YYYY-MM-DD") {
    const m = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return null;
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }

  const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!m) return null;

  if (format === "DD/MM/YYYY") {
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

function BankImportPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [dateCol, setDateCol] = useState<string>("");
  const [descCol, setDescCol] = useState<string>("");
  const [amountMode, setAmountMode] = useState<AmountMode>("signed");
  const [amountCol, setAmountCol] = useState<string>("");
  const [debitCol, setDebitCol] = useState<string>("");
  const [creditCol, setCreditCol] = useState<string>("");
  const [dateFormat, setDateFormat] = useState<DateFormat>("DD/MM/YYYY");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    void loadBankAccounts();
  }, []);

  async function loadBankAccounts() {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("id,bank_name,account_name")
      .eq("is_active", true)
      .order("bank_name");

    if (error) {
      toast.error(error.message);
      return;
    }
    setBankAccounts(data ?? []);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          toast.error("CSV appears to be empty.");
          return;
        }
        setCsvRows(rows);
        setColumns(Object.keys(rows[0]));
        setParsedRows([]);
        toast.success(`Loaded ${rows.length} rows from CSV.`);
      },
      error: (err) => {
        toast.error(`Failed to parse CSV: ${err.message}`);
      },
    });
  }

  async function buildPreview() {
    if (!selectedBankAccount) {
      toast.error("Select a bank account first.");
      return;
    }
    if (!dateCol || !descCol) {
      toast.error("Map the Date and Description columns.");
      return;
    }
    if (amountMode === "signed" && !amountCol) {
      toast.error("Map the Amount column.");
      return;
    }
    if (amountMode === "debit-credit" && (!debitCol || !creditCol)) {
      toast.error("Map both Debit and Credit columns.");
      return;
    }

    const { data: existing, error } = await supabase
      .from("bank_transactions")
      .select("txn_date,description,amount")
      .eq("bank_account_id", selectedBankAccount);

    if (error) {
      toast.error(error.message);
      return;
    }

    const existingKeys = new Set(
      (existing ?? []).map((e) => `${e.txn_date}|${e.description.trim()}|${Number(e.amount).toFixed(2)}`),
    );

    const rows: ParsedRow[] = csvRows.map((raw) => {
      const date = parseDate(raw[dateCol] ?? "", dateFormat);
      const description = (raw[descCol] ?? "").trim();

      let amount = 0;
      if (amountMode === "signed") {
        amount = parseAmount(raw[amountCol] ?? "0");
      } else {
        const debit = parseAmount(raw[debitCol] ?? "0");
        const credit = parseAmount(raw[creditCol] ?? "0");
        amount = credit - debit;
      }

      const isValid = !!date && !!description && amount !== 0;
      const key = `${date}|${description}|${amount.toFixed(2)}`;
      const isDuplicate = isValid && existingKeys.has(key);

      return { date, description, amount, raw, isDuplicate, isValid };
    });

    setParsedRows(rows);
  }

  async function commitImport() {
    const toImport = parsedRows.filter((r) => r.isValid && !r.isDuplicate);
    if (toImport.length === 0) {
      toast.error("Nothing to import — all rows are duplicates or invalid.");
      return;
    }

    setImporting(true);

    const payload = toImport.map((r) => ({
      bank_account_id: selectedBankAccount,
      txn_date: r.date as string,
      description: r.description,
      amount: r.amount,
      raw_row: r.raw,
    }));

    const { error } = await supabase.from("bank_transactions").insert(payload);

    if (error) {
      toast.error(error.message);
      setImporting(false);
      return;
    }

    toast.success(`Imported ${toImport.length} transactions.`);
    setParsedRows([]);
    setCsvRows([]);
    setColumns([]);
    setImporting(false);
  }

  const validCount = parsedRows.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Import Bank Statement</h1>
        <p className="mt-1 text-muted-foreground">
          Upload a CSV statement, map its columns, and import transactions for reconciliation.
        </p>
      </div>

      <div className="mt-6 space-y-6 rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Bank account</Label>
            <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Select a bank account" />
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

          <div className="space-y-2">
            <Label>CSV file</Label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
            />
          </div>
        </div>

        {columns.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Date column</Label>
                <Select value={dateCol} onValueChange={setDateCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date format</Label>
                <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description column</Label>
                <Select value={descCol} onValueChange={setDescCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount format</Label>
              <Select value={amountMode} onValueChange={(v) => setAmountMode(v as AmountMode)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signed">Single signed amount column</SelectItem>
                  <SelectItem value="debit-credit">Separate Debit / Credit columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {amountMode === "signed" ? (
              <div className="max-w-xs space-y-2">
                <Label>Amount column</Label>
                <Select value={amountCol} onValueChange={setAmountCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid max-w-xl gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Debit column (money out)</Label>
                  <Select value={debitCol} onValueChange={setDebitCol}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credit column (money in)</Label>
                  <Select value={creditCol} onValueChange={setCreditCol}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button onClick={() => void buildPreview()}>Preview import</Button>
          </>
        )}
      </div>

      {parsedRows.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
              {validCount} ready to import
            </span>
            {duplicateCount > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                {duplicateCount} duplicate{duplicateCount === 1 ? "" : "s"} (will be skipped)
              </span>
            )}
            {invalidCount > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                {invalidCount} invalid row{invalidCount === 1 ? "" : "s"} (will be skipped)
              </span>
            )}
          </div>

          <div className="max-h-[500px] overflow-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.date ?? "—"}</TableCell>
                    <TableCell>{row.description || "—"}</TableCell>
                    <TableCell className="text-right">{row.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {!row.isValid ? (
                        <span className="text-xs text-red-700">Invalid</span>
                      ) : row.isDuplicate ? (
                        <span className="text-xs text-amber-700">Duplicate</span>
                      ) : (
                        <span className="text-xs text-emerald-700">Ready</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button onClick={() => void commitImport()} disabled={importing || validCount === 0}>
            {importing ? "Importing…" : `Import ${validCount} transaction${validCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}
    </div>
  );
}
