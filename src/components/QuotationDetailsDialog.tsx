import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  quotationId: string;
  projectTitle?: string;
}

interface QuotationDetail {
  id: string;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface QuotationItem {
  id: string;
  description: string;
  unit: string | null;
  qty: number;
  unit_cost: number;
  amount: number;
}

export default function QuotationDetailsDialog({ quotationId, projectTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuotationDetail | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);

  async function handleOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen || quote) return;

    setLoading(true);
    try {
      const { data: q, error: qErr } = await supabase
        .from("quotations")
        .select("id,vat_rate,subtotal,vat_amount,grand_total,status,notes,created_at")
        .eq("id", quotationId)
        .single();
      if (qErr) throw qErr;
      setQuote(q as QuotationDetail);

      const { data: it, error: itErr } = await supabase
        .from("quotation_items")
        .select("id,description,unit,qty,unit_cost,amount")
        .eq("quotation_id", quotationId)
        .order("sort_order");
      if (itErr) throw itErr;
      setItems((it ?? []) as QuotationItem[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load quotation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quotation{projectTitle ? ` — ${projectTitle}` : ""}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !quote ? (
          <p className="text-sm text-muted-foreground">Unable to load this quotation.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit cost</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="p-3">{it.description}</td>
                      <td className="p-3 text-right">{it.qty}</td>
                      <td className="p-3 text-right">{Number(it.unit_cost).toFixed(2)}</td>
                      <td className="p-3 text-right">{Number(it.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t p-4 text-sm space-y-1 flex flex-col items-end">
                <div>
                  Subtotal: <strong>{Number(quote.subtotal).toFixed(2)}</strong>
                </div>
                <div>
                  VAT ({quote.vat_rate}%): <strong>{Number(quote.vat_amount).toFixed(2)}</strong>
                </div>
                <div className="text-base">
                  Grand total: <strong>{Number(quote.grand_total).toFixed(2)}</strong>
                </div>
              </div>
            </div>
            {quote.notes && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <p className="text-sm">{quote.notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
