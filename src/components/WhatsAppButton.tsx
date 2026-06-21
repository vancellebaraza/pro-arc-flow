// src/components/WhatsAppButton.tsx
import React, { useMemo, useState } from "react";
import { buildMessageForKey, TemplateKey } from "../lib/whatsapp.templates";
import { getProjectContacts, logWhatsAppAction } from "../lib/whatsapp.actions";
import { toast } from "sonner";

type RecipientRole = "client" | "engineer" | "admin";

export interface WhatsAppButtonProps {
  projectId: string;
  recipientRole: RecipientRole;
  messageType: TemplateKey | "custom";
  customMessage?: string;
  // Optional pre-fetched phone (any format) for quick UX; server remains authoritative.
  recipientPhone?: string | null;
  className?: string;
  disabled?: boolean;
}

function normalizePhoneForClient(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M20.52 3.48A11.91 11.91 0 0012 .008C5.373.008-.005 5.377-.005 12c0 2.114.555 4.18 1.61 6.01L.6 23.4l5.54-1.45A11.93 11.93 0 0012 24c6.627 0 12-5.37 12-12 0-3.2-1.25-6.2-3.48-8.52zM12 21.5c-1.9 0-3.74-.5-5.35-1.43l-.38-.22L4.4 20l.65-1.8-.23-.38A9.5 9.5 0 012.5 12c0-5.25 4.25-9.5 9.5-9.5 2.53 0 4.9.98 6.66 2.76A9.43 9.43 0 0121.5 12c0 5.25-4.25 9.5-9.5 9.5z" />
  </svg>
);

export default function WhatsAppButton(props: WhatsAppButtonProps) {
  const {
    recipientPhone: initialPhone,
    messageType,
    customMessage,
    recipientRole,
    projectId,
    className,
    disabled: explicitDisabled,
  } = props;

  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editableMessage, setEditableMessage] = useState<string | null>(null);
  const phoneDigits = useMemo(() => normalizePhoneForClient(initialPhone ?? null), [initialPhone]);

  const disabled = explicitDisabled || loading;

  const previewMessage = useMemo(() => {
    const context = {
      clientName: "",
      projectTitle: "",
      status: "",
      engineerName: "",
      errorMessage: "",
    };
    return buildMessageForKey(messageType as TemplateKey | "custom", context, customMessage);
  }, [messageType, customMessage]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);

    try {
      // Fetch up-to-date contacts & normalized phone from the server.
      const contactsRes = await getProjectContacts({ data: { projectId } });
      const phone =
        recipientRole === "client" ? contactsRes.clientPhoneNorm : contactsRes.engineerPhoneNorm;
      if (!phone) {
        toast.error(
          recipientRole === "client"
            ? "Unable to find the client phone. Please verify the client contact on this project."
            : "Unable to find the engineer phone. Please verify the engineer contact on this project.",
        );
        setLoading(false);
        return;
      }

      const bodyText =
        messageType === "custom"
          ? String(customMessage ?? "")
          : buildMessageForKey(
              messageType as TemplateKey | "custom",
              {
                clientName: contactsRes.clientName ?? "",
                projectTitle: contactsRes.projectTitle ?? "",
                status: contactsRes.status ?? "",
                engineerName: contactsRes.engineerName ?? "",
                errorMessage: "",
              },
              customMessage,
            );

      // Show preview modal and allow optional edits before sending
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
      const phone =
        recipientRole === "client" ? contactsRes.clientPhoneNorm : contactsRes.engineerPhoneNorm;
      if (!phone) {
        toast.error(
          recipientRole === "client"
            ? "Unable to find the client phone. Please verify the client contact on this project."
            : "Unable to find the engineer phone. Please verify the engineer contact on this project.",
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
          meta: { source: "web" },
        },
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

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        disabled={disabled || loading}
        aria-label="WhatsApp"
        title={previewMessage || "WhatsApp"}
        style={{
          display: "inline-flex",
          gap: 8,
          alignItems: "center",
          background: "#25D366",
          color: "#fff",
          border: "none",
          padding: "8px 10px",
          borderRadius: 6,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <WhatsAppIcon />
        <span style={{ fontWeight: 600 }}>WhatsApp</span>
      </button>
      {previewOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewOpen(false)} />
          <div className="relative w-full max-w-lg p-4 bg-white rounded shadow">
            <h3 className="font-semibold mb-2">Preview WhatsApp message</h3>
            <textarea
              value={editableMessage ?? ""}
              onChange={(e) => setEditableMessage(e.target.value)}
              className="w-full h-40 p-2 border rounded"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setPreviewOpen(false)} className="px-3 py-2 rounded border">
                Cancel
              </button>
              <button
                onClick={confirmAndSend}
                className="px-3 py-2 rounded bg-green-600 text-white"
              >
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
