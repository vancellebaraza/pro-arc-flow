import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/engineer/$projectId/compare")({
  component: ComparePage,
});

interface Row {
  id: string;
  description: string;
  qty: number;
  unit_cost: number;
  amount: number;
  actual_cost: number | null;
}

function ComparePage() {
  const { projectId } = Route.useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: q } = await supabase
      .from("quotations")
      .select("id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (q) {
      const { data } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", q.id)
        .order("sort_order");
      setRows((data ?? []) as Row[]);
    } else {
      setRows([]);
    }
    setLoading(false);
  }, [projectId]);
  useEffect(() => {
    load();
  }, [load]);

  async function updateActual(id: string, v: number) {
    const { error } = await supabase
      .from("quotation_items")
      .update({ actual_cost: v })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, actual_cost: v } : r)));
  }

  const totalQ = rows.reduce((s, r) => s + Number(r.amount), 0);
  const totalA = rows.reduce((s, r) => s + Number(r.actual_cost ?? 0), 0);
  const diff = totalA - totalQ;

  return (
    <div className="p-4 md:p-8 fade-in max-w-4xl mx-auto pb-24">
      <Link
        to="/engineer/$projectId"
        params={{ projectId }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to project
      </Link>
      <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">Quoted vs Actual</h1>
      <p className="text-muted-foreground mt-1">Update actual costs as work progresses.</p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No quotation yet for this project.</p>
      ) : (
        <div className="mt-6 rounded-lg border overflow-x-auto bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3 text-right">Quoted</th>
                <th className="p-3 text-right w-40">Actual</th>
                <th className="p-3 text-right">Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = Number(r.actual_cost ?? 0);
                const d = a - Number(r.amount);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.description}</td>
                    <td className="p-3 text-right tabular-nums">{Number(r.amount).toFixed(2)}</td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={r.actual_cost ?? 0}
                        onBlur={(e) => updateActual(r.id, Number(e.target.value))}
                        className="text-right"
                      />
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums ${d > 0 ? "text-red-700" : d < 0 ? "text-green-700" : ""}`}
                    >
                      {d.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-surface font-medium">
                <td className="p-3">Totals</td>
                <td className="p-3 text-right tabular-nums">{totalQ.toFixed(2)}</td>
                <td className="p-3 text-right tabular-nums">{totalA.toFixed(2)}</td>
                <td
                  className={`p-3 text-right tabular-nums ${diff > 0 ? "text-red-700" : diff < 0 ? "text-green-700" : ""}`}
                >
                  {diff.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
