
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateQuotationPdf } from "@/lib/pdf";
import { SERVICES, BANK_DETAILS } from "@/lib/services";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, FileDown, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mini-admin/Engineer/$projectId/quotation")({
  component: QuotationPage,
});

interface Item {
  id?: string;
  description: string;
  unit: string;
  qty: number;
  unit_cost: number;
  amount: number;
  actual_cost?: number | null;
}

type QuotationStatus =
  | "draft"
  | "pending_engineer"
  | "sent_to_client";


function QuotationPage() {
  const { projectId } = Route.useParams();
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectService, setProjectService] = useState("");

  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quoteNo, setQuoteNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [billTo, setBillTo] = useState("");
  const [recipient, setRecipient] = useState("");
  const [forText, setForText] = useState("");
  const [authorisedBy, setAuthorisedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([
    { description: "", unit: "pcs", qty: 1, unit_cost: 0, amount: 0 },
  ]);
  const [labour, setLabour] = useState(0);
  const [status, setStatus] = useState<String>("draft");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: p } = await supabase
      .from("projects")
      .select("title,location,service")
      .eq("id", projectId)
      .maybeSingle();
    if (p) {
      setProjectTitle(p.title);
      setProjectLocation(p.location ?? "");
      setProjectService(p.service);
    }
    const { data: q } = await supabase
      .from("quotations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (q) {
      setQuoteId(q.id);
      setStatus(q.status);
      setNotes(q.notes ?? "");
      setLabour(Number(q.labour ?? 0));
      setQuoteNo(q.quote_no ?? "");
      const meta = (q.meta ?? {}) as {
        bill_to?: string;
        recipient?: string;
        for_text?: string;
        authorised_by?: string;
        date?: string;
      };
      setBillTo(meta.bill_to ?? "");
      setRecipient(meta.recipient ?? "");
      setForText(meta.for_text ?? "");
      setAuthorisedBy(meta.authorised_by ?? "");
      if (meta.date) setDate(meta.date);
      const { data: it } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", q.id)
        .order("sort_order");
      const rows = (it ?? []) as Array<{
        id: string;
        description: string;
        unit: string | null;
        qty: number;
        unit_cost: number;
        amount: number;
        actual_cost: number | null;
      }>;
      if (rows.length)
        setItems(
          rows.map((r) => ({
            id: r.id,
            description: r.description,
            unit: r.unit ?? "",
            qty: Number(r.qty),
            unit_cost: Number(r.unit_cost),
            amount: Number(r.amount),
            actual_cost: r.actual_cost == null ? null : Number(r.actual_cost),
          })),
        );
    } else {
      setQuoteNo(`Q-${Date.now().toString().slice(-6)}`);
    }
  }, [projectId]);
  useEffect(() => {
    load();
  }, [load]);

  function update(i: number, patch: Partial<Item>) {
    setItems((arr) =>
      arr.map((it, idx) => {
        if (idx !== i) return it;
        const next = { ...it, ...patch };
        next.amount = Number(next.qty) * Number(next.unit_cost) || 0;
        return next;
      }),
    );
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const grandTotal = subtotal + Number(labour || 0);

  async function save(newStatus?: "draft" | "sent") {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const meta = {
        bill_to: billTo,
        recipient,
        for_text: forText,
        authorised_by: authorisedBy,
        date,
      };
      const payload = {
        project_id: projectId,
        engineer_id: u.user.id,
        vat_rate: 0,
        notes,
        subtotal,
        vat_amount: 0,
        grand_total: grandTotal,
        labour: Number(labour || 0),
        quote_no: quoteNo,
        meta,
        status: (newStatus ?? status) as "draft",
      };
      let qid = quoteId;
      if (qid) {
        const { error } = await supabase.from("quotations").update(payload).eq("id", qid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("quotations")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        qid = data.id;
        setQuoteId(qid);
      }
      await supabase.from("quotation_items").delete().eq("quotation_id", qid);
      if (items.length) {
        const rows = items.map((it, idx) => ({
          quotation_id: qid!,
          description: it.description,
          unit: it.unit || null,
          qty: it.qty,
          unit_cost: it.unit_cost,
          amount: it.amount,
          actual_cost: it.actual_cost ?? null,
          sort_order: idx,
        }));
        const { error } = await supabase.from("quotation_items").insert(rows);
        if (error) throw error;
      }
      if (newStatus) setStatus(newStatus);
      if (newStatus === "sent") {
        await supabase
          .from("projects")
          .update({ status: "quoted" as const })
          .eq("id", projectId);
      }
      toast.success(newStatus === "sent" ? "Quotation sent to client" : "Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function exportPdf() {
    try {
      await generateQuotationPdf({
        projectTitle,
        service: SERVICES.find((s) => s.key === projectService)?.label ?? projectService,
        location: projectLocation,
        billTo,
        quoteNo,
        date,
        to: recipient,
        forText,
        items: items.map((i) => ({
          description: i.description,
          unit: i.unit,
          qty: i.qty,
          unit_cost: i.unit_cost,
          amount: i.amount,
        })),
        labour: Number(labour || 0),
        subtotal,
        grandTotal,
        authorisedBy,
        notes,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    }
  }

  return (
    <div className="p-4 md:p-8 fade-in max-w-5xl mx-auto pb-24">
      <Link
        to="/mini-admin/Engineer/$projectId"
        params={{ projectId }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to project
      </Link>
      <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">Quotation</h1>
      <p className="text-muted-foreground mt-1">Project: {projectTitle}</p>

      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <Label>Bill To</Label>
          <Input
            value={billTo}
            onChange={(e) => setBillTo(e.target.value)}
            placeholder="Client / company name"
          />
        </div>
        <div>
          <Label>Quotation No</Label>
          <Input value={quoteNo} onChange={(e) => setQuoteNo(e.target.value)} />
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>To (recipient)</Label>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient name / contact"
          />
        </div>
        <div className="md:col-span-2">
          <Label>For (scope / purpose)</Label>
          <Input
            value={forText}
            onChange={(e) => setForText(e.target.value)}
            placeholder="Short scope description"
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Line Items</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((a) => [
                ...a,
                { description: "", unit: "pcs", qty: 1, unit_cost: 0, amount: 0 },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add row
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-2">Description / Detail</th>
                <th className="p-2 w-20">Unit</th>
                <th className="p-2 w-20 text-right">Quantity</th>
                <th className="p-2 w-28 text-right">Unit Cost</th>
                <th className="p-2 w-28 text-right">Amount (KES)</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t">
                  <td className="p-1">
                    <Input
                      value={it.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="Item"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={it.unit}
                      onChange={(e) => update(i, { unit: e.target.value })}
                      placeholder="pcs / m / hr"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      value={it.qty}
                      onChange={(e) => update(i, { qty: Number(e.target.value) })}
                      className="text-right"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.unit_cost}
                      onChange={(e) => update(i, { unit_cost: Number(e.target.value) })}
                      className="text-right"
                    />
                  </td>
                  <td className="p-2 text-right tabular-nums">{it.amount.toFixed(2)}</td>
                  <td className="p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setItems((a) => a.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <Label>Notes</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="mt-4">
            <Label>Authorised By</Label>
            <Input
              value={authorisedBy}
              onChange={(e) => setAuthorisedBy(e.target.value)}
              placeholder="Approver name"
            />
          </div>
        </div>
        <div className="rounded-lg border bg-surface p-4 self-start space-y-2">
          <div className="flex items-center gap-2">
            <Label className="flex-1">Labour (KES)</Label>
            <Input
              type="number"
              step="0.01"
              value={labour}
              onChange={(e) => setLabour(Number(e.target.value))}
              className="w-32 text-right"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>Sub-total</span>
            <strong className="tabular-nums">{subtotal.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between text-base">
            <span>Grand Total (KES)</span>
            <strong className="tabular-nums">{grandTotal.toFixed(2)}</strong>
          </div>
          <div className="text-xs text-muted-foreground capitalize">Status: {status}</div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <h3 className="font-medium">Payment Option — Bank Details</h3>
        <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Bank:</span>{" "}
            <strong>{BANK_DETAILS.bank}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Account Name:</span>{" "}
            <strong>{BANK_DETAILS.account_name}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Branch:</span>{" "}
            <strong>{BANK_DETAILS.branch}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Bank Code:</span>{" "}
            <strong>{BANK_DETAILS.bank_code}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Account No:</span>{" "}
            <strong>{BANK_DETAILS.account_number}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Swift Code:</span>{" "}
            <strong>{BANK_DETAILS.swift_code}</strong>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={exportPdf}>
          <FileDown className="h-4 w-4 mr-1" />
          Export PDF
        </Button>
        <Button variant="outline" disabled={saving} onClick={() => save()}>
          <Save className="h-4 w-4 mr-1" />
          Save draft
        </Button>
        <Button disabled={saving} onClick={() => save("sent")}>
          <Send className="h-4 w-4 mr-1" />
          Send to client
        </Button>
      </div>
    </div>
  );
}
