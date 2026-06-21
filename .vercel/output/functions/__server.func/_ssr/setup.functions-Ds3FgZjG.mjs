import { c as createServerRpc } from "./createServerRpc-wJmril6S.mjs";
import { c as createServerFn } from "./server-BVeZWv3h.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
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
const FIXED_ACCOUNTS = [{
  email: "admin.operations@fusionpro.realarc.co.ke",
  password: "RArc$Admin#2026!OpsX91",
  full_name: "FusionPro Admin",
  role: "admin"
}, {
  email: "eng.fieldservices@fusionpro.realarc.co.ke",
  password: "Fus!0nPr0_Eng#8472",
  full_name: "FusionPro Field Engineer",
  role: "engineer"
}];
const ensureFixedAccounts_createServerFn_handler = createServerRpc({
  id: "11f87da97981c4722d94b0e74955e403bbd681423eb21cdb8af48e04c314fe60",
  name: "ensureFixedAccounts",
  filename: "src/lib/setup.functions.ts"
}, (opts) => ensureFixedAccounts.__executeServer(opts));
const ensureFixedAccounts = createServerFn({
  method: "POST"
}).handler(ensureFixedAccounts_createServerFn_handler, async () => {
  const {
    supabaseAdmin
  } = await import("./client.server-CqmMVwYN.mjs");
  const {
    data: list,
    error: listErr
  } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 200
  });
  if (listErr) throw listErr;
  for (const acc of FIXED_ACCOUNTS) {
    const found = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
    if (!found) {
      const {
        data: newUser,
        error
      } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          full_name: acc.full_name
        }
      });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
      if (newUser?.user?.id) {
        await supabaseAdmin.from("user_roles").insert({
          user_id: newUser.user.id,
          role: acc.role
        }).throwOnError();
      }
    } else {
      const {
        data: existingRoles
      } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", found.id).eq("role", acc.role);
      if (!existingRoles || existingRoles.length === 0) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", found.id);
        await supabaseAdmin.from("user_roles").insert({
          user_id: found.id,
          role: acc.role
        }).throwOnError();
      }
    }
  }
  return {
    ok: true
  };
});
export {
  ensureFixedAccounts_createServerFn_handler
};
