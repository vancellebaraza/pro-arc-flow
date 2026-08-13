import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type AuditAction = "insert" | "update" | "delete";

/**
 * Fire-and-forget audit log write. Never throws — a logging failure
 * must not block the user's actual action (invoice save, payment record, etc).
 * Errors are logged to console only.
 */
export async function logAudit(
  tableName: string,
  recordId: string,
  action: AuditAction,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
) {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("audit_logs").insert({
      table_name: tableName,
      record_id: recordId,
      action,
      changed_by: userData?.user?.id ?? null,
      old_data: oldData as Json | null,
      new_data: newData as Json | null,
    });

    if (error) {
      console.error(`Audit log failed for ${tableName}/${recordId}:`, error.message);
    }
  } catch (err) {
    console.error(`Audit log threw for ${tableName}/${recordId}:`, err);
  }
}
