import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-L2Z55D81.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { S as SERVICES } from "./services-BNXDMItn.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { m as CloudUpload, X, L as LoaderCircle } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
function NewRequest() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [files, setFiles] = reactExports.useState([]);
  function onFiles(list) {
    if (!list) return;
    const arr = Array.from(list).slice(0, 2 - files.length);
    setFiles((f) => [...f, ...arr].slice(0, 2));
  }
  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const urls = [];
      for (const file of files) {
        const path = `${u.user.id}/${Date.now()}-${file.name}`;
        const {
          error: upErr
        } = await supabase.storage.from("project-images").upload(path, file);
        if (upErr) throw upErr;
        const {
          data: signed
        } = await supabase.storage.from("project-images").createSignedUrl(path, 60 * 60 * 24 * 30);
        if (signed?.signedUrl) urls.push(signed.signedUrl);
      }
      const {
        error
      } = await supabase.from("projects").insert({
        client_id: u.user.id,
        service: String(fd.get("service")),
        title: String(fd.get("title")),
        description: String(fd.get("description") || ""),
        location: String(fd.get("location") || ""),
        image_urls: urls
      });
      if (error) throw error;
      toast.success("Request submitted");
      navigate({
        to: "/client"
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 md:p-10 max-w-2xl mx-auto fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-semibold tracking-tight", children: "New service request" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Tell us what you need. An engineer will follow up shortly." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "mt-8 space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service", children: "Service" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { id: "service", name: "service", required: true, className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", children: SERVICES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.key, children: s.label }, s.key)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "title", children: "Title" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "title", name: "title", required: true, maxLength: 120, placeholder: "e.g. Kitchen sink leaking" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "location", children: "Location" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "location", name: "location", maxLength: 200, placeholder: "Building, unit, address" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", children: "Description" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "description", name: "description", rows: 5, maxLength: 2e3, placeholder: "Describe the issue or scope" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Images (max 2)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-1 flex items-center justify-center rounded-md border border-dashed bg-surface px-4 py-6 text-sm text-muted-foreground cursor-pointer hover:bg-accent transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "h-4 w-4 mr-2" }),
          " Click to upload",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => onFiles(e.target.files) })
        ] }),
        files.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 space-y-1 text-sm", children: files.map((f, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between rounded border px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: f.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setFiles((arr) => arr.filter((_, j) => j !== i)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: submitting, className: "w-full", children: [
        submitting && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-2" }),
        "Submit request"
      ] })
    ] })
  ] });
}
export {
  NewRequest as component
};
