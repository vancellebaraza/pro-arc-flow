import { createServerFn } from "@tanstack/react-start";

const FIXED_ACCOUNTS = [
  {
    email: "admin.operations@fusionpro.realarc.co.ke",
    password: "RArc$Admin#2026!OpsX91",
    full_name: "FusionPro Admin",
  },
  {
    email: "eng.fieldservices@fusionpro.realarc.co.ke",
    password: "Fus!0nPr0_Eng#8472",
    full_name: "FusionPro Field Engineer",
  },
];

export const ensureFixedAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  for (const acc of FIXED_ACCOUNTS) {
    const found = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
    if (!found) {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.full_name },
      });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
    }
  }
  return { ok: true };
});
