import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { s as supabase } from "./_ssr/client-L2Z55D81.mjs";
import { I as Input } from "./_ssr/input-C0QjszdI.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { f as Route } from "./_ssr/router-DdPd7JgK.mjs";
import { i as ArrowLeft } from "./_libs/lucide-react.mjs";
import "./_libs/tanstack__router-core.mjs";
import "./_libs/tanstack__history.mjs";
import "./_libs/cookie-es.mjs";
import "./_libs/seroval.mjs";
import "./_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "./_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./_libs/isbot.mjs";
import "./_libs/supabase__supabase-js.mjs";
import "./_libs/supabase__postgrest-js.mjs";
import "./_libs/supabase__realtime-js.mjs";
import "./_libs/supabase__phoenix.mjs";
import "./_libs/supabase__storage-js.mjs";
import "./_libs/iceberg-js.mjs";
import "./_libs/supabase__auth-js.mjs";
import "tslib";
import "./_libs/supabase__functions-js.mjs";
import "./_ssr/utils-H80jjgLf.mjs";
import "./_libs/clsx.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/tanstack__query-core.mjs";
import "./_libs/tanstack__react-query.mjs";
function ComparePage() {
  const {
    projectId
  } = Route.useParams();
  const [rows, setRows] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const load = reactExports.useCallback(async () => {
    setLoading(true);
    const {
      data: q
    } = await supabase.from("quotations").select("id").eq("project_id", projectId).order("created_at", {
      ascending: false
    }).maybeSingle();
    if (q) {
      const {
        data
      } = await supabase.from("quotation_items").select("*").eq("quotation_id", q.id).order("sort_order");
      setRows(data ?? []);
    } else {
      setRows([]);
    }
    setLoading(false);
  }, [projectId]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  async function updateActual(id, v) {
    const {
      error
    } = await supabase.from("quotation_items").update({
      actual_cost: v
    }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((arr) => arr.map((r) => r.id === id ? {
      ...r,
      actual_cost: v
    } : r));
  }
  const totalQ = rows.reduce((s, r) => s + Number(r.amount), 0);
  const totalA = rows.reduce((s, r) => s + Number(r.actual_cost ?? 0), 0);
  const diff = totalA - totalQ;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-8 fade-in max-w-4xl mx-auto pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/engineer/$projectId", params: {
      projectId
    }, className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
      "Back to project"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl md:text-3xl font-semibold tracking-tight", children: "Quoted vs Actual" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Update actual costs as work progresses." }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-sm text-muted-foreground", children: "Loading…" }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-sm text-muted-foreground", children: "No quotation yet for this project." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 rounded-lg border overflow-x-auto bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-surface text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "Item" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: "Quoted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right w-40", children: "Actual" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: "Diff" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((r) => {
        const a = Number(r.actual_cost ?? 0);
        const d = a - Number(r.amount);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: r.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right tabular-nums", children: Number(r.amount).toFixed(2) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.01", defaultValue: r.actual_cost ?? 0, onBlur: (e) => updateActual(r.id, Number(e.target.value)), className: "text-right" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-3 text-right tabular-nums ${d > 0 ? "text-red-700" : d < 0 ? "text-green-700" : ""}`, children: d.toFixed(2) })
        ] }, r.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t bg-surface font-medium", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: "Totals" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right tabular-nums", children: totalQ.toFixed(2) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right tabular-nums", children: totalA.toFixed(2) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-3 text-right tabular-nums ${diff > 0 ? "text-red-700" : diff < 0 ? "text-green-700" : ""}`, children: diff.toFixed(2) })
      ] }) })
    ] }) })
  ] });
}
export {
  ComparePage as component
};
