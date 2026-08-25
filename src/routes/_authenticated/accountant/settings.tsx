import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/settings")({
  component: SettingsPage,
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vatRate, setVatRate] = useState("16");
  const [currencyCode, setCurrencyCode] = useState("KES");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [invoiceNextNumber, setInvoiceNextNumber] = useState("1");
  const [invoiceNumberPadding, setInvoiceNumberPadding] = useState("4");
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState("1");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (error) {
      toast.error(error.message);
    } else if (data) {
      setVatRate(String(data.vat_rate));
      setCurrencyCode(data.currency_code);
      setInvoicePrefix(data.invoice_prefix);
      setInvoiceNextNumber(String(data.invoice_next_number));
      setInvoiceNumberPadding(String(data.invoice_number_padding));
      setFiscalYearStartMonth(String(data.fiscal_year_start_month));
    }
    setLoading(false);
  }

  async function handleSave() {
    const parsedVat = Number(vatRate);
    const parsedNextNumber = Number(invoiceNextNumber);
    const parsedPadding = Number(invoiceNumberPadding);
    const parsedFiscalMonth = Number(fiscalYearStartMonth);

    if (Number.isNaN(parsedVat) || parsedVat < 0) {
      toast.error("VAT rate must be a valid non-negative number.");
      return;
    }
    if (!currencyCode.trim()) {
      toast.error("Currency code is required.");
      return;
    }
    if (!invoicePrefix.trim()) {
      toast.error("Invoice prefix is required.");
      return;
    }
    if (!Number.isInteger(parsedNextNumber) || parsedNextNumber < 1) {
      toast.error("Next invoice number must be a whole number of at least 1.");
      return;
    }
    if (!Number.isInteger(parsedPadding) || parsedPadding < 1 || parsedPadding > 10) {
      toast.error("Invoice number padding must be a whole number between 1 and 10.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("company_settings")
        .update({
          vat_rate: parsedVat,
          currency_code: currencyCode.trim().toUpperCase(),
          invoice_prefix: invoicePrefix.trim().toUpperCase(),
          invoice_next_number: parsedNextNumber,
          invoice_number_padding: parsedPadding,
          fiscal_year_start_month: parsedFiscalMonth,
          updated_by: userData.user?.id ?? null,
        })
        .eq("id", true);

      if (error) throw error;

      toast.success("Settings saved.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  const previewNumber = `${invoicePrefix.trim().toUpperCase() || "INV"}-${invoiceNextNumber.padStart(
    Number(invoiceNumberPadding) || 4,
    "0",
  )}`;

  return (
    <div className="p-4 md:p-8 fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Company-wide defaults for VAT, invoice numbering, fiscal year and currency.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax & currency</CardTitle>
              <CardDescription>
                Applied as the default on new quotations. Existing quotations keep their own rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate">Default VAT rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencyCode">Currency code</Label>
                <Input
                  id="currencyCode"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  maxLength={3}
                  placeholder="KES"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice numbering</CardTitle>
              <CardDescription>
                New invoices are numbered automatically using this prefix and counter. The counter
                advances every time an invoice is created — it cannot be rewound to avoid duplicate
                numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumberPadding">Digit padding</Label>
                  <Input
                    id="invoiceNumberPadding"
                    type="number"
                    min="1"
                    max="10"
                    value={invoiceNumberPadding}
                    onChange={(e) => setInvoiceNumberPadding(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNextNumber">Next invoice number</Label>
                <Input
                  id="invoiceNextNumber"
                  type="number"
                  min="1"
                  value={invoiceNextNumber}
                  onChange={(e) => setInvoiceNextNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Next invoice will be numbered: <span className="font-mono">{previewNumber}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fiscal year</CardTitle>
              <CardDescription>
                Sets which month your financial year begins. Reports do not use this yet — stored
                here for when fiscal-year reporting is added.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="fiscalYearStartMonth">Fiscal year starts in</Label>
                <Select value={fiscalYearStartMonth} onValueChange={setFiscalYearStartMonth}>
                  <SelectTrigger id="fiscalYearStartMonth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={month} value={String(index + 1)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      )}
    </div>
  );
}
