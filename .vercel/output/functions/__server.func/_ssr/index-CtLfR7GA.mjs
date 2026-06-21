import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { S as SERVICES } from "./services-BNXDMItn.mjs";
import { L as Logo } from "./Logo-BzZZAGIA.mjs";
import { A as ArrowRight, d as ClipboardList, S as ShieldCheck, e as ChartColumn } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
function Landing() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b bg-background/80 backdrop-blur sticky top-0 z-30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl flex items-center justify-between px-6 h-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-9 w-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex items-center gap-6 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#services", className: "text-muted-foreground hover:text-foreground transition", children: "Services" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#about", className: "text-muted-foreground hover:text-foreground transition", children: "About" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", className: "inline-flex items-center gap-1 rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition", children: [
          "Sign in ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-6xl px-6 pt-24 pb-20 fade-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground", children: "RealArc Estates · Operations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl", children: "One system for every property service request, inspection, and report." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed", children: "FusionPro coordinates clients, engineers, and admins across electrical, plumbing, landscaping, painting, property management, and tank cleaning — from intake to completion." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", className: "inline-flex items-center gap-2 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition", children: [
          "Get started ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#services", className: "inline-flex items-center rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-accent transition", children: "View services" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "services", className: "border-t bg-surface", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end justify-between flex-wrap gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl md:text-3xl font-semibold tracking-tight", children: "Services" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "End-to-end coverage across property operations." })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: SERVICES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group overflow-hidden rounded-xl border bg-card transition hover:border-foreground/30 hover:-translate-y-0.5 hover:shadow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-[16/10] overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.image, alt: s.label, width: 1024, height: 640, loading: "lazy", className: "h-full w-full object-cover transition duration-500 group-hover:scale-105" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-3 left-3 flex items-center gap-2 text-background", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center rounded-md bg-background/15 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium drop-shadow", children: s.label })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: s.desc }) })
      ] }, s.key)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "about", className: "border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-3 gap-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl md:text-3xl font-semibold tracking-tight", children: "About" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-muted-foreground", children: "Built for RealArc Estates' multi-trade operations team." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2 grid sm:grid-cols-3 gap-6", children: [{
        icon: ClipboardList,
        t: "Structured intake",
        d: "Clients submit requests with details and images. Engineers receive and inspect."
      }, {
        icon: ShieldCheck,
        t: "Quote & approve",
        d: "Excel-style quotation tables, client approval, admin scheduling."
      }, {
        icon: ChartColumn,
        t: "Track & report",
        d: "Progress stages, quoted vs actual costs, PDF & CSV exports."
      }].map((x) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(x.icon, { className: "h-5 w-5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-3 font-medium", children: x.t }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: x.d })
      ] }, x.t)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-6 w-auto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "© ",
          (/* @__PURE__ */ new Date()).getFullYear(),
          " RealArc Estates"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "hover:text-foreground transition", children: "Sign in" })
    ] }) })
  ] });
}
export {
  Landing as component
};
