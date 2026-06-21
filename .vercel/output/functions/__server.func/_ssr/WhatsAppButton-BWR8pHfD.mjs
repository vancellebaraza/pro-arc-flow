import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as createSsrRpc } from "./createSsrRpc-jWsLEEEm.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-LQvPTbq-.mjs";
import { c as createServerFn } from "./server-BVeZWv3h.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { o as objectType, s as stringType, r as recordType, a as anyType } from "../_libs/zod.mjs";
const templates = {
  request_correction: {
    title: "Request correction",
    body: "Hi {{clientName}}, this is {{engineerName}}. Please correct the following for {{projectTitle}} (status: {{status}}): {{errorMessage}}"
  },
  quotation_approved: {
    title: "Quotation approved",
    body: "Hi {{clientName}}, the quotation for {{projectTitle}} has been approved by {{engineerName}}. Status: {{status}}."
  },
  work_completed: {
    title: "Work completed",
    body: "Hi {{clientName}}, work for {{projectTitle}} has been completed by {{engineerName}}. Status: {{status}}. Please confirm receipt."
  },
  inspection_failed: {
    title: "Inspection failed",
    body: "Hi {{clientName}}, inspection for {{projectTitle}} returned issues: {{errorMessage}}. Contact {{engineerName}} for details. Status: {{status}}."
  }
};
function renderTemplate(templateStr, ctx) {
  return templateStr.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const k = key.trim();
    const v = ctx[k];
    return v == null ? "" : String(v);
  });
}
function buildMessageForKey(key, ctx, customMessage) {
  if (key === "custom") {
    return customMessage ? String(customMessage) : "";
  }
  const tpl = templates[key];
  return renderTemplate(tpl.body, ctx);
}
const GetContactsInput = objectType({
  projectId: stringType().min(1)
});
const getProjectContacts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => GetContactsInput.parse(d)).handler(createSsrRpc("34289704121d8b127eb7af3e6b02559dca8d18fa9f17685a81266a054a6657e8"));
const LogInput = objectType({
  projectId: stringType().min(1).nullable(),
  recipientPhone: stringType().nullable(),
  recipientRole: stringType().nullable(),
  messageType: stringType().nullable(),
  body: stringType().nullable(),
  meta: recordType(anyType()).nullable()
});
const logWhatsAppAction = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => LogInput.parse(d)).handler(createSsrRpc("94fd1a8c385a25b379e468cd77e370ae6976769f2bf564761f7cee0204e16c2e"));
function normalizePhoneForClient(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}
const WhatsAppIcon = ({ className }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "svg",
  {
    className,
    xmlns: "http://www.w3.org/2000/svg",
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20.52 3.48A11.91 11.91 0 0012 .008C5.373.008-.005 5.377-.005 12c0 2.114.555 4.18 1.61 6.01L.6 23.4l5.54-1.45A11.93 11.93 0 0012 24c6.627 0 12-5.37 12-12 0-3.2-1.25-6.2-3.48-8.52zM12 21.5c-1.9 0-3.74-.5-5.35-1.43l-.38-.22L4.4 20l.65-1.8-.23-.38A9.5 9.5 0 012.5 12c0-5.25 4.25-9.5 9.5-9.5 2.53 0 4.9.98 6.66 2.76A9.43 9.43 0 0121.5 12c0 5.25-4.25 9.5-9.5 9.5z" })
  }
);
function WhatsAppButton(props) {
  const {
    recipientPhone: initialPhone,
    messageType,
    customMessage,
    recipientRole,
    projectId,
    className,
    disabled: explicitDisabled
  } = props;
  const [loading, setLoading] = reactExports.useState(false);
  const [previewOpen, setPreviewOpen] = reactExports.useState(false);
  const [editableMessage, setEditableMessage] = reactExports.useState(null);
  reactExports.useMemo(() => normalizePhoneForClient(initialPhone ?? null), [initialPhone]);
  const disabled = explicitDisabled || loading;
  const previewMessage = reactExports.useMemo(() => {
    const context = {
      clientName: "",
      projectTitle: "",
      status: "",
      engineerName: "",
      errorMessage: ""
    };
    return buildMessageForKey(messageType, context, customMessage);
  }, [messageType, customMessage]);
  async function handleClick(e) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      const contactsRes = await getProjectContacts({ data: { projectId } });
      const phone = recipientRole === "client" ? contactsRes.clientPhoneNorm : contactsRes.engineerPhoneNorm;
      if (!phone) {
        toast.error(
          recipientRole === "client" ? "Unable to find the client phone. Please verify the client contact on this project." : "Unable to find the engineer phone. Please verify the engineer contact on this project."
        );
        setLoading(false);
        return;
      }
      const bodyText = messageType === "custom" ? String(customMessage ?? "") : buildMessageForKey(
        messageType,
        {
          clientName: contactsRes.clientName ?? "",
          projectTitle: contactsRes.projectTitle ?? "",
          status: contactsRes.status ?? "",
          engineerName: contactsRes.engineerName ?? "",
          errorMessage: ""
        },
        customMessage
      );
      setEditableMessage(bodyText);
      setPreviewOpen(true);
    } catch (err) {
      console.error("WhatsAppButton error", err);
      toast.error("Failed to open WhatsApp");
    } finally {
      setLoading(false);
    }
  }
  async function confirmAndSend() {
    if (!editableMessage) return;
    setPreviewOpen(false);
    setLoading(true);
    try {
      const contactsRes = await getProjectContacts({ data: { projectId } });
      const phone = recipientRole === "client" ? contactsRes.clientPhoneNorm : contactsRes.engineerPhoneNorm;
      if (!phone) {
        toast.error(
          recipientRole === "client" ? "Unable to find the client phone. Please verify the client contact on this project." : "Unable to find the engineer phone. Please verify the engineer contact on this project."
        );
        return;
      }
      const newWindow = window.open("about:blank", "_blank");
      if (!newWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups and try again.");
        return;
      }
      await logWhatsAppAction({
        data: {
          projectId,
          recipientPhone: phone,
          recipientRole,
          messageType,
          body: editableMessage,
          meta: { source: "web" }
        }
      }).catch((err) => {
        console.warn("logWhatsAppAction failed", err);
        toast.error("Could not record message in logs; message will still open");
      });
      const encoded = encodeURIComponent(editableMessage);
      const waUrl = `https://wa.me/${phone}?text=${encoded}`;
      newWindow.location.href = waUrl;
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: handleClick,
        className,
        disabled: disabled || loading,
        "aria-label": "WhatsApp",
        title: previewMessage || "WhatsApp",
        style: {
          display: "inline-flex",
          gap: 8,
          alignItems: "center",
          background: "#25D366",
          color: "#fff",
          border: "none",
          padding: "8px 10px",
          borderRadius: 6,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WhatsAppIcon, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 600 }, children: "WhatsApp" })
        ]
      }
    ),
    previewOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "dialog", "aria-modal": true, className: "fixed inset-0 z-50 grid place-items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/40", onClick: () => setPreviewOpen(false) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full max-w-lg p-4 bg-white rounded shadow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-2", children: "Preview WhatsApp message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: editableMessage ?? "",
            onChange: (e) => setEditableMessage(e.target.value),
            className: "w-full h-40 p-2 border rounded"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPreviewOpen(false), className: "px-3 py-2 rounded border", children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: confirmAndSend,
              className: "px-3 py-2 rounded bg-green-600 text-white",
              children: "Open WhatsApp"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  WhatsAppButton as W
};
