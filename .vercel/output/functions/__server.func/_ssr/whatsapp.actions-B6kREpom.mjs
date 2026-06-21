import { c as createServerRpc } from "./createServerRpc-wJmril6S.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-LQvPTbq-.mjs";
import { c as createServerFn } from "./server-BVeZWv3h.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, r as recordType, a as anyType } from "../_libs/zod.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./createMiddleware-BvN2ghIY.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
function formatPhoneForWhatsApp(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits;
}
async function getProjectContacts$1(supabase, projectId) {
  const { data: projectData, error: projectError } = await supabase.from("projects").select("id, title, status, client_id, engineer_id").eq("id", projectId).limit(1).single();
  if (projectError || !projectData) {
    return { projectId };
  }
  const projectTitle = projectData.title ?? void 0;
  const status = projectData.status ?? void 0;
  const clientId = projectData.client_id ?? void 0;
  const engineerId = projectData.engineer_id ?? void 0;
  const ids = [];
  if (clientId) ids.push(clientId);
  if (engineerId) ids.push(engineerId);
  let clientName;
  let clientPhone;
  let engineerName;
  let engineerPhone;
  if (ids.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone").in("id", ids);
    (profiles ?? []).forEach(
      (p) => {
        if (p.id === clientId) {
          clientName = p.full_name ?? void 0;
          clientPhone = p.phone ?? null;
        } else if (p.id === engineerId) {
          engineerName = p.full_name ?? void 0;
          engineerPhone = p.phone ?? null;
        }
      }
    );
  }
  return {
    projectId,
    projectTitle,
    status,
    clientId,
    clientName,
    clientPhone: clientPhone ?? null,
    engineerId,
    engineerName,
    engineerPhone: engineerPhone ?? null
  };
}
async function logWhatsAppAction$1(supabase, payload) {
  let body = payload.body ?? null;
  if (payload.message_type) {
    body = `[${payload.message_type}] ${body ?? ""}`;
  }
  if (payload.meta) {
    try {
      const metaStr = JSON.stringify(payload.meta);
      body = `${body ?? ""}

[meta] ${metaStr}`;
    } catch (e) {
    }
  }
  const insert = {
    sender_id: payload.sender_id,
    project_id: payload.project_id ?? null,
    recipient: payload.recipient_phone ?? null,
    body: body ?? ""
  };
  try {
    await supabase.from("whatsapp_logs").insert(insert);
  } catch (e) {
  }
}
const GetContactsInput = objectType({
  projectId: stringType().min(1)
});
const getProjectContacts_createServerFn_handler = createServerRpc({
  id: "34289704121d8b127eb7af3e6b02559dca8d18fa9f17685a81266a054a6657e8",
  name: "getProjectContacts",
  filename: "src/lib/whatsapp.actions.ts"
}, (opts) => getProjectContacts.__executeServer(opts));
const getProjectContacts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => GetContactsInput.parse(d)).handler(getProjectContacts_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    projectId
  } = data;
  const contacts = await getProjectContacts$1(supabase, projectId);
  const clientPhoneNorm = formatPhoneForWhatsApp(contacts.clientPhone ?? null);
  const engineerPhoneNorm = formatPhoneForWhatsApp(contacts.engineerPhone ?? null);
  return {
    ...contacts,
    clientPhoneNorm,
    engineerPhoneNorm
  };
});
const LogInput = objectType({
  projectId: stringType().min(1).nullable(),
  recipientPhone: stringType().nullable(),
  recipientRole: stringType().nullable(),
  messageType: stringType().nullable(),
  body: stringType().nullable(),
  meta: recordType(anyType()).nullable()
});
const logWhatsAppAction_createServerFn_handler = createServerRpc({
  id: "94fd1a8c385a25b379e468cd77e370ae6976769f2bf564761f7cee0204e16c2e",
  name: "logWhatsAppAction",
  filename: "src/lib/whatsapp.actions.ts"
}, (opts) => logWhatsAppAction.__executeServer(opts));
const logWhatsAppAction = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => LogInput.parse(d)).handler(logWhatsAppAction_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  await logWhatsAppAction$1(supabase, {
    sender_id: userId ?? null,
    recipient_phone: data.recipientPhone ?? null,
    recipient_role: data.recipientRole ?? null,
    project_id: data.projectId ?? null,
    message_type: data.messageType ?? null,
    body: data.body ?? null,
    meta: data.meta ?? null
  });
  return {
    ok: true
  };
});
export {
  getProjectContacts_createServerFn_handler,
  logWhatsAppAction_createServerFn_handler
};
