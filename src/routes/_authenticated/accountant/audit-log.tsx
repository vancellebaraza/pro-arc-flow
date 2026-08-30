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
                    <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                      {e.old_data && (
                        <div>
                          <div className="mb-1 text-muted-foreground">Before</div>
                          <pre className="overflow-x-auto rounded bg-muted/50 p-2">
                            {JSON.stringify(e.old_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {e.new_data && (
                        <div>
                          <div className="mb-1 text-muted-foreground">After</div>
                          <pre className="overflow-x-auto rounded bg-muted/50 p-2">
                            {JSON.stringify(e.new_data, null, 2)}
                          </pre>
                        </div>
                      )}
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
