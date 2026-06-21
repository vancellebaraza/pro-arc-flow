import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-L2Z55D81.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { S as SERVICES, a as STATUS_LABEL } from "./services-BNXDMItn.mjs";
import { d as downloadCsv } from "./pdf-C4AXfmaR.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/jspdf.mjs";
import "../_libs/jspdf-autotable.mjs";
import { F as FileDown, g as Check, h as Calendar } from "../_libs/lucide-react.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "fs";
import "path";
import "../_libs/fflate.mjs";
import "../_libs/fast-png.mjs";
import "../_libs/iobuffer.mjs";
import "../_libs/pako.mjs";
import "../_libs/html2canvas.mjs";
import "../_libs/dompurify.mjs";
import "../_libs/canvg.mjs";
import "../_libs/core-js.mjs";
import "../_libs/babel__runtime.mjs";
import "../_libs/raf.mjs";
import "../_libs/performance-now.mjs";
import "../_libs/rgbcolor.mjs";
import "../_libs/svg-pathdata.mjs";
import "../_libs/stackblur-canvas.mjs";
function AdminHome() {
  const [rows, setRows] = reactExports.useState([]);
  const [pendingQuotes, setPendingQuotes] = reactExports.useState([]);
  const [filter, setFilter] = reactExports.useState("");
  const load = reactExports.useCallback(async () => {
    const {
      data
    } = await supabase.from("projects").select("*").order("created_at", {
      ascending: false
    });
    setRows(data ?? []);
    const {
      data: q
    } = await supabase.from("quotations").select("id,project_id,grand_total,status, project:projects(title)").eq("status", "sent");
    setPendingQuotes(q ?? []);
  }, []);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  async function approveQuote(qid, pid) {
    await supabase.from("quotations").update({
      status: "approved"
    }).eq("id", qid);
    await supabase.from("projects").update({
      status: "approved"
    }).eq("id", pid);
    toast.success("Quotation approved");
    load();
  }
  async function schedule(p) {
    const date = prompt("Schedule date (YYYY-MM-DD)", p.scheduled_date ?? "");
    if (!date) return;
    await supabase.from("projects").update({
      scheduled_date: date,
      status: "scheduled"
    }).eq("id", p.id);
    toast.success("Scheduled");
    load();
  }
  function exportSheet() {
    const data = rows.map((r) => ({
      id: r.id.slice(0, 8),
      title: r.title,
      service: r.service,
      status: r.status,
      location: r.location ?? "",
      scheduled_date: r.scheduled_date ?? "",
      created_at: r.created_at
    }));
    downloadCsv(`fusionpro-work-data-sheet-${Date.now()}.csv`, data);
  }
  const filtered = rows.filter((r) => !filter || r.title.toLowerCase().includes(filter.toLowerCase()) || r.service.includes(filter.toLowerCase()));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-8 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between flex-wrap gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-semibold tracking-tight", children: "Admin overview" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Approve quotations, schedule work, export reports." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: exportSheet, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4 mr-1" }),
        "Export Work Data Sheet (CSV)"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid md:grid-cols-3 gap-4", children: [{
      label: "Total projects",
      value: rows.length
    }, {
      label: "In progress",
      value: rows.filter((r) => r.status === "in_progress" || r.status === "scheduled").length
    }, {
      label: "Pending quotes",
      value: pendingQuotes.length
    }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: s.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-3xl font-semibold", children: s.value })
    ] }, s.label)) }),
    pendingQuotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Quotations pending approval" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 rounded-xl border bg-card divide-y", children: pendingQuotes.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-4 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium truncate", children: q.project?.title ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
            "Total: ",
            Number(q.grand_total).toFixed(2)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => approveQuote(q.id, q.project_id), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-1" }),
          "Approve"
        ] })
      ] }, q.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between gap-3 flex-wrap mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Work Data Sheet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Filter…", value: filter, onChange: (e) => setFilter(e.target.value), className: "max-w-xs" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-surface text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "Service" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "Location" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "Scheduled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          filtered.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: r.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: SERVICES.find((s) => s.key === r.service)?.label ?? r.service }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: STATUS_LABEL[r.status] ?? r.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: r.location ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: r.scheduled_date ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: () => schedule(r), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 mr-1" }),
              "Schedule"
            ] }) })
          ] }, r.id)),
          filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "p-6 text-center text-sm text-muted-foreground", children: "No projects." }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  AdminHome as component
};
