import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { s as supabase } from "./_ssr/client-L2Z55D81.mjs";
import { B as Button } from "./_ssr/button-BC9oXVxV.mjs";
import { T as Textarea } from "./_ssr/textarea-DSyJ1nlY.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { d as Route$2 } from "./_ssr/router-DdPd7JgK.mjs";
import { i as ArrowLeft, o as MessageCircle, c as Send } from "./_libs/lucide-react.mjs";
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
import "./_libs/tanstack__query-core.mjs";
import "./_libs/tanstack__react-query.mjs";
function MessagesPage() {
  const {
    projectId
  } = Route$2.useParams();
  const [messages, setMessages] = reactExports.useState([]);
  const [projectTitle, setProjectTitle] = reactExports.useState("");
  const [body, setBody] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    const {
      data: p
    } = await supabase.from("projects").select("title").eq("id", projectId).maybeSingle();
    if (p) setProjectTitle(p.title);
    const {
      data
    } = await supabase.from("messages").select("*").eq("project_id", projectId).order("created_at");
    setMessages(data ?? []);
  }, [projectId]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  async function send() {
    if (!body.trim() || sending) return;
    setSending(true);
    const {
      data: u
    } = await supabase.auth.getUser();
    if (!u.user) return;
    const {
      error
    } = await supabase.from("messages").insert({
      project_id: projectId,
      sender_id: u.user.id,
      body: body.trim(),
      channel: "internal"
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setBody("");
    load();
  }
  const waMsg = encodeURIComponent(`FusionPro — Project: ${projectTitle}. `);
  async function logWa() {
    const {
      data: u
    } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("whatsapp_logs").insert({
      sender_id: u.user.id,
      project_id: projectId,
      recipient: null,
      body: decodeURIComponent(waMsg)
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-8 fade-in max-w-3xl mx-auto pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/engineer/$projectId", params: {
      projectId
    }, className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
      "Back to project"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-end justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-semibold tracking-tight", children: "Communication" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Internal messages and WhatsApp launcher (logged)." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://wa.me/?text=${waMsg}`, target: "_blank", rel: "noreferrer", onClick: logWa, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4 mr-1" }),
        "Open WhatsApp"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 space-y-2", children: messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No messages yet." }) : messages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: new Date(m.created_at).toLocaleString() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm whitespace-pre-wrap", children: m.body })
    ] }, m.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-lg border bg-card p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 3, value: body, onChange: (e) => setBody(e.target.value), placeholder: "Write a message…" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: send, disabled: sending || !body.trim(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 mr-1" }),
        "Send"
      ] }) })
    ] })
  ] });
}
export {
  MessagesPage as component
};
