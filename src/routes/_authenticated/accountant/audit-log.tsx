import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant/audit-log")({
  component: AuditLogPage,
});

interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string | null;
  changed_by_name?: string;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

const LABEL_OVERRIDES: Record<string, string> = {
  id: "ID",
  vat_amount: "VAT amount",
  vat_rate: "VAT rate",
  parent_id: "Parent",
  account_id: "Account",
  invoice_id: "Invoice",
  quotation_id: "Quotation",
  client_id: "Client",
  vendor_id: "Vendor",
  is_active: "Active",
};

function formatLabel(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function buildChangeRows(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
): { key: string; before: unknown; after: unknown; changed: boolean }[] {
  const keys = new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]);
  return Array.from(keys)
    .map((key) => ({
      key,
      before: oldData ? oldData[key] : undefined,
      after: newData ? newData[key] : undefined,
      changed: oldData && newData ? JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]) : true,
    }))
    .filter((row) => (oldData && newData ? row.changed : true))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);

    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,table_name,record_id,action,changed_by,changed_at,old_data,new_data")
      .order("changed_at", { ascending: false })
      .limit(200);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((data ?? []).map((e) => e.changed_by).filter(Boolean))] as string[];
    const nameMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", userIds);

      for (const p of profiles ?? []) {
        nameMap.set(p.id, p.full_name ?? p.id);
      }
    }

    const mapped = (data ?? []).map((e) => ({
      id: e.id,
      table_name: e.table_name,
      record_id: e.record_id,
      action: e.action,
      changed_by: e.changed_by,
      changed_by_name: e.changed_by ? nameMap.get(e.changed_by) ?? e.changed_by : "System",
      changed_at: e.changed_at,
      old_data: e.old_data as Record<string, unknown> | null,
      new_data: e.new_data as Record<string, unknown> | null,
    }));

    setEntries(mapped);
    setLoading(false);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A read-only record of who changed what, and when. Nothing here can be edited or deleted.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity (last 200)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="text-sm text-muted-foreground">No audit activity recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="rounded-lg border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium capitalize">{e.action}</span>{" "}
                      <span className="text-muted-foreground">on</span>{" "}
                      <span className="font-medium">{e.table_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {e.changed_by_name} • {new Date(e.changed_at).toLocaleString()}
                    </div>
                  </div>
                  {(e.old_data || e.new_data) && (
                    <div className="mt-3 space-y-1.5 rounded-md bg-muted/40 p-3">
                      {buildChangeRows(e.old_data, e.new_data).map((row) => (
                        <div key={row.key} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <span className="min-w-[9rem] font-medium text-foreground">
                            {formatLabel(row.key)}:
                          </span>
                          {e.old_data && e.new_data ? (
                            <span className="text-muted-foreground">
                              {formatValue(row.before)}{" "}
                              <span className="mx-1">→</span>{" "}
                              <span className="text-foreground">{formatValue(row.after)}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {formatValue(e.new_data ? row.after : row.before)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
