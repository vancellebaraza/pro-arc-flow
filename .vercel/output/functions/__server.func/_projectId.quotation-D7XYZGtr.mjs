import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { s as supabase } from "./_ssr/client-L2Z55D81.mjs";
import { B as Button } from "./_ssr/button-BC9oXVxV.mjs";
import { I as Input } from "./_ssr/input-C0QjszdI.mjs";
import { L as Label } from "./_ssr/label-JU3yqRBo.mjs";
import { T as Textarea } from "./_ssr/textarea-DSyJ1nlY.mjs";
import { g as generateQuotationPdf } from "./_ssr/pdf-C4AXfmaR.mjs";
import { B as BANK_DETAILS, S as SERVICES } from "./_ssr/services-BNXDMItn.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { c as Route$3 } from "./_ssr/router-DdPd7JgK.mjs";
import "./_libs/jspdf.mjs";
import "./_libs/jspdf-autotable.mjs";
import { i as ArrowLeft, P as Plus, T as Trash2, F as FileDown, n as Save, c as Send } from "./_libs/lucide-react.mjs";
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
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_ssr/utils-H80jjgLf.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/radix-ui__react-label.mjs";
import "./_libs/radix-ui__react-primitive.mjs";
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
function QuotationPage() {
  const {
    projectId
  } = Route$3.useParams();
  const [projectTitle, setProjectTitle] = reactExports.useState("");
  const [projectLocation, setProjectLocation] = reactExports.useState("");
  const [projectService, setProjectService] = reactExports.useState("");
  const [quoteId, setQuoteId] = reactExports.useState(null);
  const [quoteNo, setQuoteNo] = reactExports.useState("");
  const [date, setDate] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [billTo, setBillTo] = reactExports.useState("");
  const [recipient, setRecipient] = reactExports.useState("");
  const [forText, setForText] = reactExports.useState("");
  const [authorisedBy, setAuthorisedBy] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
  const [items, setItems] = reactExports.useState([{
    description: "",
    unit: "pcs",
    qty: 1,
    unit_cost: 0,
    amount: 0
  }]);
  const [labour, setLabour] = reactExports.useState(0);
  const [status, setStatus] = reactExports.useState("draft");
  const [saving, setSaving] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    const {
      data: p
    } = await supabase.from("projects").select("title,location,service").eq("id", projectId).maybeSingle();
    if (p) {
      setProjectTitle(p.title);
      setProjectLocation(p.location ?? "");
      setProjectService(p.service);
    }
    const {
      data: q
    } = await supabase.from("quotations").select("*").eq("project_id", projectId).order("created_at", {
      ascending: false
    }).maybeSingle();
    if (q) {
      setQuoteId(q.id);
      setStatus(q.status);
      setNotes(q.notes ?? "");
      setLabour(Number(q.labour ?? 0));
      setQuoteNo(q.quote_no ?? "");
      const meta = q.meta ?? {};
      setBillTo(meta.bill_to ?? "");
      setRecipient(meta.recipient ?? "");
      setForText(meta.for_text ?? "");
      setAuthorisedBy(meta.authorised_by ?? "");
      if (meta.date) setDate(meta.date);
      const {
        data: it
      } = await supabase.from("quotation_items").select("*").eq("quotation_id", q.id).order("sort_order");
      const rows = it ?? [];
      if (rows.length) setItems(rows.map((r) => ({
        id: r.id,
        description: r.description,
        unit: r.unit ?? "",
        qty: Number(r.qty),
        unit_cost: Number(r.unit_cost),
        amount: Number(r.amount),
        actual_cost: r.actual_cost == null ? null : Number(r.actual_cost)
      })));
    } else {
      setQuoteNo(`Q-${Date.now().toString().slice(-6)}`);
    }
  }, [projectId]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  function update(i, patch) {
    setItems((arr) => arr.map((it, idx) => {
      if (idx !== i) return it;
      const next = {
        ...it,
        ...patch
      };
      next.amount = Number(next.qty) * Number(next.unit_cost) || 0;
      return next;
    }));
  }
  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const grandTotal = subtotal + Number(labour || 0);
  async function save(newStatus) {
    setSaving(true);
    try {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const meta = {
        bill_to: billTo,
        recipient,
        for_text: forText,
        authorised_by: authorisedBy,
        date
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
        status: newStatus ?? status
      };
      let qid = quoteId;
      if (qid) {
        const {
          error
        } = await supabase.from("quotations").update(payload).eq("id", qid);
        if (error) throw error;
      } else {
        const {
          data,
          error
        } = await supabase.from("quotations").insert(payload).select("id").single();
        if (error) throw error;
        qid = data.id;
        setQuoteId(qid);
      }
      await supabase.from("quotation_items").delete().eq("quotation_id", qid);
      if (items.length) {
        const rows = items.map((it, idx) => ({
          quotation_id: qid,
          description: it.description,
          unit: it.unit || null,
          qty: it.qty,
          unit_cost: it.unit_cost,
          amount: it.amount,
          actual_cost: it.actual_cost ?? null,
          sort_order: idx
        }));
        const {
          error
        } = await supabase.from("quotation_items").insert(rows);
        if (error) throw error;
      }
      if (newStatus) setStatus(newStatus);
      if (newStatus === "sent") {
        await supabase.from("projects").update({
          status: "quoted"
        }).eq("id", projectId);
      }
      toast.success(newStatus === "sent" ? "Quotation sent to client" : "Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }
  function exportPdf() {
    generateQuotationPdf({
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
        amount: i.amount
      })),
      labour: Number(labour || 0),
      subtotal,
      grandTotal,
      authorisedBy,
      notes
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-8 fade-in max-w-5xl mx-auto pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/engineer/$projectId", params: {
      projectId
    }, className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
      "Back to project"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl md:text-3xl font-semibold tracking-tight", children: "Quotation" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mt-1", children: [
      "Project: ",
      projectTitle
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Bill To" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: billTo, onChange: (e) => setBillTo(e.target.value), placeholder: "Client / company name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Quotation No" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: quoteNo, onChange: (e) => setQuoteNo(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: date, onChange: (e) => setDate(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "To (recipient)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: recipient, onChange: (e) => setRecipient(e.target.value), placeholder: "Recipient name / contact" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "For (scope / purpose)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: forText, onChange: (e) => setForText(e.target.value), placeholder: "Short scope description" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Line Items" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setItems((a) => [...a, {
          description: "",
          unit: "pcs",
          qty: 1,
          unit_cost: 0,
          amount: 0
        }]), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
          "Add row"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 overflow-x-auto rounded-lg border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-surface text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "Description / Detail" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-20", children: "Unit" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-20 text-right", children: "Quantity" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-28 text-right", children: "Unit Cost" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-28 text-right", children: "Amount (KES)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "w-10" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: it.description, onChange: (e) => update(i, {
            description: e.target.value
          }), placeholder: "Item" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: it.unit, onChange: (e) => update(i, {
            unit: e.target.value
          }), placeholder: "pcs / m / hr" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: it.qty, onChange: (e) => update(i, {
            qty: Number(e.target.value)
          }), className: "text-right" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.01", value: it.unit_cost, onChange: (e) => update(i, {
            unit_cost: Number(e.target.value)
          }), className: "text-right" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-right tabular-nums", children: it.amount.toFixed(2) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", onClick: () => setItems((a) => a.filter((_, j) => j !== i)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
        ] }, i)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Notes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 4, value: notes, onChange: (e) => setNotes(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Authorised By" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: authorisedBy, onChange: (e) => setAuthorisedBy(e.target.value), placeholder: "Approver name" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-surface p-4 self-start space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "flex-1", children: "Labour (KES)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.01", value: labour, onChange: (e) => setLabour(Number(e.target.value)), className: "w-32 text-right" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sub-total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "tabular-nums", children: subtotal.toFixed(2) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-base", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Grand Total (KES)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "tabular-nums", children: grandTotal.toFixed(2) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground capitalize", children: [
          "Status: ",
          status
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8 rounded-lg border bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Payment Option — Bank Details" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Bank:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: BANK_DETAILS.bank })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Account Name:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: BANK_DETAILS.account_name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Branch:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: BANK_DETAILS.branch })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Bank Code:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: BANK_DETAILS.bank_code })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Account No:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: BANK_DETAILS.account_number })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Swift Code:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: BANK_DETAILS.swift_code })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-wrap justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: exportPdf, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4 mr-1" }),
        "Export PDF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", disabled: saving, onClick: () => save(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4 mr-1" }),
        "Save draft"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: saving, onClick: () => save("sent"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 mr-1" }),
        "Send to client"
      ] })
    ] })
  ] });
}
export {
  QuotationPage as component
};
