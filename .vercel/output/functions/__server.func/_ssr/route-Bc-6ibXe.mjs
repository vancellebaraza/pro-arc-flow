import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, e as useRouterState, L as Link, O as Outlet } from "../_libs/tanstack__react-router.mjs";
import { u as useMyRoles, s as signOutClean } from "./auth-wNEK1Bir.mjs";
import { L as Logo } from "./Logo-BzZZAGIA.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { u as useServerFn } from "./useServerFn-DL2oePlL.mjs";
import { c as createSsrRpc } from "./createSsrRpc-jWsLEEEm.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-LQvPTbq-.mjs";
import { c as createServerFn } from "./server-BVeZWv3h.mjs";
import "../_libs/seroval.mjs";
import { S as ShieldCheck, W as Wrench, C as ClipboardPlus, a as LayoutDashboard, b as LogOut, M as Menu, B as Bot, X, L as LoaderCircle, c as Send } from "../_libs/lucide-react.mjs";
import { o as objectType, b as arrayType, s as stringType, e as enumType } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "./client-L2Z55D81.mjs";
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
import "./createMiddleware-BvN2ghIY.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
const ChatInput = objectType({
  message: stringType().min(1).max(2e3),
  history: arrayType(objectType({
    role: enumType(["user", "assistant"]),
    content: stringType()
  })).max(20).default([])
});
const chatWithAssistant = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => ChatInput.parse(d)).handler(createSsrRpc("bcdee306dc21b5ba28a0566471f76de3fe258d06de3e9683a2fb5059df9316e0"));
function AIAssistant() {
  const [open, setOpen] = reactExports.useState(false);
  const [messages, setMessages] = reactExports.useState([]);
  const [input, setInput] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const chat = useServerFn(chatWithAssistant);
  const endRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);
  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const { reply } = await chat({ data: { message: msg, history: messages.slice(-10) } });
      setMessages((m) => [...m, { role: "assistant", content: reply || "(no response)" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ " + (e instanceof Error ? e.message : "Failed") }
      ]);
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    !open && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setOpen(true),
        className: "fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-foreground text-background shadow-lg grid place-items-center hover:scale-105 transition",
        "aria-label": "Open FusionPro AI",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5" })
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(580px,calc(100vh-2rem))] rounded-xl border bg-card shadow-2xl flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b bg-foreground text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: "FusionPro AI" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), "aria-label": "Close", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-3 text-sm", children: [
        messages.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-muted-foreground text-xs leading-relaxed", children: [
          "Hi — I'm FusionPro AI. I answer using your system data only. Try:",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-2 space-y-1 list-disc pl-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "What's the status of my projects?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Summarise the last quotation." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Which projects are delayed?" })
          ] })
        ] }),
        messages.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `whitespace-pre-wrap rounded-lg px-3 py-2 ${m.role === "user" ? "bg-foreground text-background ml-8" : "bg-accent mr-8"}`,
            children: m.content
          },
          i
        )),
        loading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-muted-foreground text-xs flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }),
          " thinking…"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: endRef })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "form",
        {
          onSubmit: (e) => {
            e.preventDefault();
            send();
          },
          className: "border-t p-2 flex gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: input,
                onChange: (e) => setInput(e.target.value),
                placeholder: "Ask…",
                className: "flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm",
                disabled: loading
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                disabled: loading || !input.trim(),
                className: "rounded-md bg-foreground text-background px-3 disabled:opacity-50",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
              }
            )
          ]
        }
      )
    ] })
  ] });
}
function AuthedLayout() {
  const {
    primaryRole,
    loading
  } = useMyRoles();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (s) => s.location.pathname
  });
  const [mobileNavOpen, setMobileNavOpen] = reactExports.useState(false);
  const links = primaryRole === "admin" ? [{
    to: "/admin",
    label: "Admin",
    icon: ShieldCheck
  }, {
    to: "/engineer",
    label: "Engineer view",
    icon: Wrench
  }, {
    to: "/client",
    label: "Client view",
    icon: ClipboardPlus
  }] : primaryRole === "engineer" ? [{
    to: "/engineer",
    label: "Engineer",
    icon: Wrench
  }] : [{
    to: "/client",
    label: "My projects",
    icon: LayoutDashboard
  }, {
    to: "/client/new",
    label: "New request",
    icon: ClipboardPlus
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex w-full bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "hidden md:flex w-60 shrink-0 flex-col border-r surface", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 flex items-center px-5 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-7 w-auto" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 p-3 space-y-1", children: links.map((l) => {
        const active = pathname === l.to || pathname.startsWith(l.to + "/");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: l.to, className: `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? "bg-foreground text-background" : "hover:bg-accent text-foreground"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(l.icon, { className: "h-4 w-4" }),
          " ",
          l.label
        ] }, l.to);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", className: "w-full justify-start", onClick: () => signOutClean(navigate), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4 mr-2" }),
        "Sign out"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "md:hidden h-14 border-b flex items-center justify-between px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-6 w-auto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setMobileNavOpen((v) => !v), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" }) }),
          mobileNavOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-12 z-40 w-56 rounded-md border bg-popover shadow-md p-2", children: [
            links.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: l.to, onClick: () => setMobileNavOpen(false), className: "flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(l.icon, { className: "h-4 w-4" }),
              l.label
            ] }, l.to)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
              setMobileNavOpen(false);
              signOutClean(navigate);
            }, className: "flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
              "Sign out"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 min-w-0", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AIAssistant, {})
  ] });
}
export {
  AuthedLayout as component
};
