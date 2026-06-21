import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { s as supabase } from "./_ssr/client-L2Z55D81.mjs";
import { B as Button } from "./_ssr/button-BC9oXVxV.mjs";
import { S as SERVICES, a as STATUS_LABEL } from "./_ssr/services-BNXDMItn.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { g as generateQuotationPdf } from "./_ssr/pdf-C4AXfmaR.mjs";
import { W as WhatsAppButton } from "./_ssr/WhatsAppButton-BWR8pHfD.mjs";
import { a as Route$5 } from "./_ssr/router-DdPd7JgK.mjs";
import "./_libs/jspdf.mjs";
import "./_libs/jspdf-autotable.mjs";
import "./_libs/seroval.mjs";
import { i as ArrowLeft, F as FileDown, X, g as Check } from "./_libs/lucide-react.mjs";
import "./_libs/tanstack__router-core.mjs";
import "./_libs/tanstack__history.mjs";
import "./_libs/cookie-es.mjs";
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
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_ssr/utils-H80jjgLf.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_ssr/createSsrRpc-jWsLEEEm.mjs";
import "./_ssr/server-BVeZWv3h.mjs";
import "node:async_hooks";
import "./_libs/h3-v2.mjs";
import "./_libs/rou3.mjs";
import "./_libs/srvx.mjs";
import "./_ssr/auth-middleware-LQvPTbq-.mjs";
import "./_ssr/createMiddleware-BvN2ghIY.mjs";
import "./_libs/zod.mjs";
import "./_libs/tanstack__query-core.mjs";
import "./_libs/tanstack__react-query.mjs";
import "fs";
import "path";
import "./_libs/fflate.mjs";
import "./_libs/fast-png.mjs";
import "./_libs/iobuffer.mjs";
import "./_libs/pako.mjs";
import "./_libs/html2canvas.mjs";
import "./_libs/dompurify.mjs";
import "./_libs/canvg.mjs";
import "./_libs/core-js.mjs";
import "./_libs/babel__runtime.mjs";
import "./_libs/raf.mjs";
import "./_libs/performance-now.mjs";
import "./_libs/rgbcolor.mjs";
import "./_libs/svg-pathdata.mjs";
import "./_libs/stackblur-canvas.mjs";
function ProjectDetail() {
  const {
    projectId
  } = Route$5.useParams();
  const [project, setProject] = reactExports.useState(null);
  const [quote, setQuote] = reactExports.useState(null);
  const [items, setItems] = reactExports.useState([]);
  const [inspections, setInspections] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const load = reactExports.useCallback(async () => {
    const {
      data: p
    } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
    setProject(p);
    const {
      data: q
    } = await supabase.from("quotations").select("*").eq("project_id", projectId).order("created_at", {
      ascending: false
    }).maybeSingle();
    setQuote(q);
    if (q) {
      const {
        data: it
      } = await supabase.from("quotation_items").select("*").eq("quotation_id", q.id).order("sort_order");
      setItems(it ?? []);
    }
    const {
      data: ins
    } = await supabase.from("inspections").select("*").eq("project_id", projectId).order("created_at", {
      ascending: false
    });
    setInspections(ins ?? []);
    setLoading(false);
  }, [projectId]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  async function decide(status) {
    if (!quote) return;
    const {
      error
    } = await supabase.from("quotations").update({
      status
    }).eq("id", quote.id);
    if (error) return toast.error(error.message);
    if (project) {
      await supabase.from("projects").update({
        status: status === "approved" ? "approved" : "rejected"
      }).eq("id", project.id);
    }
    toast.success(`Quotation ${status}`);
    load();
  }
  function downloadPdf() {
    if (!quote || !project) return;
    const labour = items.reduce((sum, it) => sum + Number(it.amount), 0);
    generateQuotationPdf({
      projectTitle: project.title,
      service: SERVICES.find((s) => s.key === project.service)?.label ?? project.service,
      location: project.location,
      quoteNo: quote.id.slice(0, 8).toUpperCase(),
      billTo: project.title,
      date: new Date(quote.created_at).toLocaleDateString(),
      items,
      labour,
      subtotal: Number(quote.subtotal),
      grandTotal: Number(quote.grand_total),
      notes: quote.notes
    });
  }
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Loading…" });
  if (!project) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm", children: "Project not found." });
  const svc = SERVICES.find((s) => s.key === project.service);
  const waText = `FusionPro — Project: ${project.title} (${STATUS_LABEL[project.status] ?? project.status}). Reference: ${project.id.slice(0, 8)}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 md:p-10 max-w-4xl mx-auto fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/client", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
      "Back"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: svc?.label }),
          "·",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: STATUS_LABEL[project.status] ?? project.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-semibold tracking-tight mt-1", children: project.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: project.location })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsAppButton, { projectId: project.id, recipientRole: "engineer", messageType: "custom", customMessage: waText })
    ] }),
    project.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-sm leading-relaxed", children: project.description }),
    project.image_urls.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid grid-cols-2 gap-3", children: project.image_urls.map((u, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: u, target: "_blank", rel: "noreferrer", className: "block rounded-md overflow-hidden border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: u, alt: `attachment ${i + 1}`, className: "w-full h-40 object-cover" }) }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Inspection reports" }),
      inspections.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "No inspections yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-3", children: inspections.map((ins) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-lg border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium capitalize", children: [
            ins.stage,
            " inspection"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: new Date(ins.created_at).toLocaleDateString() })
        ] }),
        Array.isArray(ins.checklist) && ins.checklist.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 text-sm space-y-1", children: ins.checklist.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: c.pass ? "text-green-700" : "text-destructive", children: c.pass ? "✓" : "✕" }),
          c.item,
          c.remark && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            " — ",
            c.remark
          ] })
        ] }, i)) }),
        ins.remarks && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: ins.remarks })
      ] }, ins.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Quotation" }),
        quote && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: downloadPdf, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4 mr-1" }),
          "Download PDF"
        ] })
      ] }),
      !quote ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "No quotation yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-lg border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-surface text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: "Qty" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: "Unit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: "Amount" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: it.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: it.qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: Number(it.unit_cost).toFixed(2) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: Number(it.amount).toFixed(2) })
          ] }, it.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t p-4 text-sm space-y-1 flex flex-col items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "Subtotal: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: Number(quote.subtotal).toFixed(2) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "VAT (",
            quote.vat_rate,
            "%): ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: Number(quote.vat_amount).toFixed(2) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-base", children: [
            "Grand total: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: Number(quote.grand_total).toFixed(2) })
          ] })
        ] }),
        quote.status === "sent" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t p-4 flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => decide("rejected"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4 mr-1" }),
            "Reject"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => decide("approved"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-1" }),
            "Approve"
          ] })
        ] }),
        quote.status !== "sent" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t p-3 text-xs text-muted-foreground text-right capitalize", children: [
          "Status: ",
          quote.status
        ] })
      ] })
    ] })
  ] });
}
export {
  ProjectDetail as component
};
