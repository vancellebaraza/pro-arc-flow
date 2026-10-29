import { supabase } from "@/integrations/supabase/client";

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);

export interface PrintableInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  status: string;
  subtotal?: number;
  vat_amount?: number;
  total: number;
  client_name: string | null;
}

/** Opens a print-ready invoice in a new window; "Save as PDF" in the print dialog gives the PDF. */
export async function printInvoice(inv: PrintableInvoice): Promise<void> {
  // Open synchronously (inside the click) so popup blockers allow it, then fill once data arrives.
  const win = window.open("", "_blank");
  if (!win) throw new Error("Pop-up blocked. Allow pop-ups to print the invoice.");
  win.document.write("<p style='font-family:sans-serif'>Preparing invoice…</p>");

  const { data: lines, error } = await supabase
    .from("invoice_lines")
    .select("description,unit,qty,unit_cost,amount,sort_order")
    .eq("invoice_id", inv.id)
    .order("sort_order");
  if (error) {
    win.close();
    throw error;
  }

  const rows = (lines ?? [])
    .map(
      (l) =>
        `<tr><td>${esc(l.description)}</td><td>${esc(l.unit)}</td><td class="r">${esc(l.qty)}</td><td class="r">${Number(l.unit_cost).toFixed(2)}</td><td class="r">${Number(l.amount).toFixed(2)}</td></tr>`,
    )
    .join("");
  const totalRow = (label: string, v: number) =>
    `<tr class="tot"><td colspan="4" class="r">${label}</td><td class="r">${v.toFixed(2)}</td></tr>`;

  win.document.open();
  win.document
    .write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.invoice_number)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:14px}.r{text-align:right}.tot td{font-weight:600;border-bottom:none}
.muted{color:#666;font-size:14px}</style></head><body>
<h1>Invoice ${esc(inv.invoice_number)}</h1>
<div class="muted">${inv.client_name ? `Bill to: ${esc(inv.client_name)}<br>` : ""}Issued ${esc(new Date(inv.issue_date).toLocaleDateString())}${inv.due_date ? ` • Due ${esc(new Date(inv.due_date).toLocaleDateString())}` : ""} • Status: ${esc(inv.status)}</div>
<table><thead><tr><th>Description</th><th>Unit</th><th class="r">Qty</th><th class="r">Unit cost</th><th class="r">Amount</th></tr></thead><tbody>${rows}
${inv.subtotal != null ? totalRow("Subtotal", Number(inv.subtotal)) : ""}${inv.vat_amount != null ? totalRow("VAT", Number(inv.vat_amount)) : ""}${totalRow("Total", Number(inv.total))}
</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`);
  win.document.close();
}
