import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link, O as Outlet } from "./_libs/tanstack__react-router.mjs";
import { s as supabase } from "./_ssr/client-L2Z55D81.mjs";
import { S as SERVICES, a as STATUS_LABEL } from "./_ssr/services-BNXDMItn.mjs";
import { B as Button } from "./_ssr/button-BC9oXVxV.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { W as WhatsAppButton } from "./_ssr/WhatsAppButton-BWR8pHfD.mjs";
import { R as Route$7 } from "./_ssr/router-DdPd7JgK.mjs";
import "./_libs/seroval.mjs";
import { i as ArrowLeft, j as ClipboardCheck, k as FileText, d as ClipboardList, G as GitCompare, l as MessageSquare, A as ArrowRight } from "./_libs/lucide-react.mjs";
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
function EngineerProjectHub() {
  const {
    projectId
  } = Route$7.useParams();
  const [project, setProject] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const load = reactExports.useCallback(async () => {
    setLoading(true);
    const {
      data
    } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
    setProject(data);
    setLoading(false);
  }, [projectId]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  async function claim() {
    const {
      data: u
    } = await supabase.auth.getUser();
    if (!u.user || !project) return;
    await supabase.from("projects").update({
      engineer_id: u.user.id
    }).eq("id", project.id);
    toast.success("Assigned to you");
    load();
  }
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Loading…" });
  if (!project) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm", children: "Project not found." });
  const svc = SERVICES.find((s) => s.key === project.service);
  const waText = `FusionPro engineer here regarding "${project.title}" (Ref ${project.id.slice(0, 8)}). `;
  const tools = [{
    to: "/engineer/$projectId/inspection",
    title: "Inspection report",
    desc: "Checklist, photos, sign-off.",
    icon: ClipboardCheck
  }, {
    to: "/engineer/$projectId/quotation",
    title: "Quotation",
    desc: "Bill-to, line items, totals & bank details.",
    icon: FileText
  }, {
    to: "/engineer/$projectId/worksheet",
    title: "Job worksheet",
    desc: "Document 2 — site observations & sign-off.",
    icon: ClipboardList
  }, {
    to: "/engineer/$projectId/compare",
    title: "Quoted vs Actual",
    desc: "Compare estimated vs actual costs.",
    icon: GitCompare
  }, {
    to: "/engineer/$projectId/messages",
    title: "Communication",
    desc: "Internal messages & WhatsApp log.",
    icon: MessageSquare
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-8 fade-in max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/engineer", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
      "Back to projects"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: [
          svc?.label,
          " · ",
          STATUS_LABEL[project.status] ?? project.status
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-semibold tracking-tight mt-1 truncate", children: project.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: project.location ?? "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        !project.engineer_id && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: claim, children: "Assign to me" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsAppButton, { projectId: project.id, recipientRole: "client", messageType: "custom", customMessage: waText, className: "" })
      ] })
    ] }),
    project.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-sm leading-relaxed", children: project.description }),
    project.image_urls?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 grid grid-cols-2 md:grid-cols-4 gap-2", children: project.image_urls.map((u, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: u, target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: u, className: "rounded border h-28 w-full object-cover", alt: `Attachment ${i + 1}` }) }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-10 text-lg font-semibold tracking-tight", children: "Forms & tools" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Each form opens in its own page so you have room to work." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: tools.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: t.to, params: {
      projectId: project.id
    }, className: "flex items-start gap-3 rounded-xl border bg-card p-5 hover:border-foreground/40 hover:shadow-sm transition", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-md bg-foreground/5 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: t.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mt-0.5", children: t.desc })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground mt-1" })
    ] }) }, t.to)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] });
}
export {
  EngineerProjectHub as component
};
