import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAudit } from "@/lib/auditLog";
import { AlertTriangle, ExternalLink, Flag, Printer, Wallet } from "lucide-react";
import { getUserCached } from "@/lib/auth-cache";
import { useMyRoles } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/accountant/ConfirmDialog";
import { CsvButton } from "@/components/accountant/CsvButton";
import {
  RecordPaymentDialog,
  type PayableInvoice,
} from "@/components/accountant/RecordPaymentDialog";
import { printInvoice } from "@/lib/invoicePrint";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/accountant/invoices")({
  component: InvoicesPage,
});

interface ApprovableQuotation {
  id: string;
  project_id: string;
  project_title: string;
  client_id: string;
  client_display_name: string | null;
  subtotal: number;
  labour: number;
  vat_amount: number;
  grand_total: number;
  do_not_invoice: boolean;
  do_not_invoice_reason: string | null;
  project_status: string | null;
}

interface FlagInfo {
  flagged: boolean;
  reason: string | null;
  project_id?: string | null;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  issue_date: string;
  due_date: string | null;
  quotation_id: string;
  subtotal: number;
  vat_amount: number;
  client_id: string;
  client_display_name: string | null;
}

interface StuckProject {
  job_number: string;
  title: string;
  completed_at: string | null;
  quotation_status: string;
  grand_total: number;
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function InvoicesPage() {
  const [availableQuotations, setAvailableQuotations] = useState<ApprovableQuotation[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [blockedProjects, setBlockedProjects] = useState<StuckProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<ApprovableQuotation | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const { roles } = useMyRoles();
  // Matches the task spec; the database policy decides what is actually allowed (see setFlag).
  const canFlag = roles.includes("admin") || roles.includes("accountant");
  const [showFlagged, setShowFlagged] = useState(false);
  const [invoiceFlags, setInvoiceFlags] = useState<Map<string, FlagInfo>>(new Map());
  const [flagTarget, setFlagTarget] = useState<{ id: string; label: string } | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagBusy, setFlagBusy] = useState(false);
  const [paidByInvoice, setPaidByInvoice] = useState<Map<string, number>>(new Map());
  const [clientNames, setClientNames] = useState<Map<string, string>>(new Map());
  const [paying, setPaying] = useState<PayableInvoice | null>(null);
  const [sendTarget, setSendTarget] = useState<InvoiceRecord | null>(null);
  const [sending, setSending] = useState(false);
  // Synchronous lock so a double click cannot post the same invoice twice.
  const sendInFlight = useRef(false);
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: existingInvoices, error: invoicesError } = await supabase
      .from("invoices")
      .select(
        "id,invoice_number,status,total,issue_date,due_date,quotation_id,subtotal,vat_amount,client_id,client_display_name",
      )
      .order("created_at", { ascending: false });

    if (invoicesError) {
      toast.error(invoicesError.message);
      setLoading(false);
      return;
    }

    setInvoices(existingInvoices ?? []);

    const { data: allocRows } = await supabase
      .from("payment_allocations")
      .select("invoice_id,amount_applied");
    const paid = new Map<string, number>();
    for (const a of allocRows ?? []) {
      paid.set(a.invoice_id, (paid.get(a.invoice_id) ?? 0) + (Number(a.amount_applied) || 0));
    }
    setPaidByInvoice(paid);

    const clientIds = [
      ...new Set((existingInvoices ?? []).map((i) => i.client_id).filter(Boolean)),
    ];
    if (clientIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", clientIds);
      setClientNames(new Map((profs ?? []).map((pr) => [pr.id, pr.full_name ?? ""])));
    }

    const invoicedQuotationIds = new Set((existingInvoices ?? []).map((inv) => inv.quotation_id));

    if (invoicedQuotationIds.size > 0) {
      const { data: flagRows } = await supabase
        .from("quotations")
        .select("id,do_not_invoice,do_not_invoice_reason,project_id")
        .in("id", [...invoicedQuotationIds]);
      setInvoiceFlags(
        new Map(
          (flagRows ?? []).map((f) => [
            f.id,
            {
              flagged: !!f.do_not_invoice,
              reason: f.do_not_invoice_reason ?? null,
              project_id: f.project_id ?? null,
            },
          ]),
        ),
      );
    } else {
      setInvoiceFlags(new Map());
    }

    const { data: quotations, error: quotationsError } = await supabase
      .from("quotations")
      .select(
        "id,project_id,subtotal,labour,vat_amount,grand_total,do_not_invoice,do_not_invoice_reason,projects(title,status,client_id,client_display_name)",
      )
      .eq("status", "approved");

    if (quotationsError) {
      toast.error(quotationsError.message);
      setLoading(false);
      return;
    }

    const mapped = (quotations ?? [])
      .filter((q) => !invoicedQuotationIds.has(q.id))
      .map((q) => {
        const project = q.projects as unknown as {
          title: string;
          status: string | null;
          client_id: string;
          client_display_name: string | null;
        } | null;
        return {
          id: q.id,
          project_id: q.project_id,
          project_title: project?.title ?? "Untitled project",
          client_id: project?.client_id ?? "",
          client_display_name: project?.client_display_name ?? null,
          subtotal: Number(q.subtotal) || 0,
          labour: Number(q.labour) || 0,
          vat_amount: Number(q.vat_amount) || 0,
          grand_total: Number(q.grand_total) || 0,
          do_not_invoice: !!q.do_not_invoice,
          do_not_invoice_reason: q.do_not_invoice_reason ?? null,
          project_status: project?.status ?? null,
        };
      });

    setAvailableQuotations(mapped);

    // Completed projects whose quotation never got approved — invisible everywhere
    // else in Accounts, and the exact gap that let real invoices go unbilled.
    const { data: completedProjects, error: completedError } = await supabase
      .from("projects")
      .select("job_number,title,status,updated_at,quotations(status,grand_total)")
      .eq("status", "completed");

    if (!completedError && completedProjects) {
      const stuck: StuckProject[] = [];
      for (const p of completedProjects as any[]) {
        const quotationRows = (p.quotations ?? []) as Array<{
          status: string;
          grand_total: number;
        }>;
        const relevant = quotationRows.find((q) => q.status !== "approved");
        const hasApproved = quotationRows.some((q) => q.status === "approved");
        if (relevant && !hasApproved) {
          stuck.push({
            job_number: p.job_number,
            title: p.title,
            completed_at: p.updated_at,
            quotation_status: relevant.status,
            grand_total: Number(relevant.grand_total) || 0,
          });
        }
      }
      stuck.sort((a, b) => (daysSince(b.completed_at) ?? 0) - (daysSince(a.completed_at) ?? 0));
      setBlockedProjects(stuck);
    }

    setLoading(false);
  }

  function openCreateDialog(quotation: ApprovableQuotation) {
    setCreating(quotation);
    setDueDate("");
  }

  async function handleCreateInvoice() {
    if (!creating) return;

    setSaving(true);
    try {
      const { data: userData } = await getUserCached();

      const { data: generatedNumber, error: numberError } =
        await supabase.rpc("next_invoice_number");

      if (numberError || !generatedNumber) {
        throw numberError ?? new Error("Could not generate invoice number.");
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          quotation_id: creating.id,
          client_id: creating.client_id,
          client_display_name: creating.client_display_name,
          invoice_number: generatedNumber,
          due_date: dueDate || null,
          status: "draft",
          // Fold labour into subtotal so subtotal + vat_amount always equals total —
          // the ledger posting trigger relies on this invariant holding exactly.
          subtotal: creating.subtotal + creating.labour,
          vat_amount: creating.vat_amount,
          total: creating.grand_total,
          created_by: userData.user?.id ?? null,
        })
        .select("id")
        .single();

      if (invoiceError || !invoiceData?.id) {
        throw invoiceError ?? new Error("Could not create invoice.");
      }

      await logAudit("invoices", invoiceData.id, "insert", null, {
        quotation_id: creating.id,
        client_id: creating.client_id,
        invoice_number: generatedNumber,
        due_date: dueDate || null,
        status: "draft",
        subtotal: creating.subtotal + creating.labour,
        vat_amount: creating.vat_amount,
        total: creating.grand_total,
      });

      const { data: quotationItems, error: itemsError } = await supabase
        .from("quotation_items")
        .select("description,unit,qty,unit_cost,amount,sort_order")
        .eq("quotation_id", creating.id)
        .order("sort_order");

      if (itemsError) {
        throw itemsError;
      }

      if (quotationItems && quotationItems.length > 0) {
        const lines = quotationItems.map((item) => ({
          invoice_id: invoiceData.id,
          description: item.description,
          unit: item.unit,
          qty: item.qty,
          unit_cost: item.unit_cost,
          amount: item.amount,
          sort_order: item.sort_order,
        }));

        const { error: linesError } = await supabase.from("invoice_lines").insert(lines);
        if (linesError) {
          throw linesError;
        }
      }

      toast.success("Invoice created as draft.");
      setCreating(null);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function setFlag(quotationId: string, flagged: boolean, reason: string) {
    setFlagBusy(true);
    try {
      const reasonValue = flagged ? reason.trim() || null : null;
      // Narrow cast: the generated Supabase types are empty on this branch, so the RPC is untyped.
      const { error } = await (
        supabase as unknown as {
          rpc: (
            fn: "set_quotation_do_not_invoice",
            args: { _quotation_id: string; _flag: boolean; _reason: string | null },
          ) => PromiseLike<{ error: { message: string } | null }>;
        }
      ).rpc("set_quotation_do_not_invoice", {
        _quotation_id: quotationId,
        _flag: flagged,
        _reason: reasonValue,
      });
      if (error) throw new Error(error.message);
      await logAudit(
        "quotations",
        quotationId,
        "update",
        { do_not_invoice: !flagged },
        { do_not_invoice: flagged, do_not_invoice_reason: reasonValue },
      );
      toast.success(flagged ? "Marked as test data - will not be invoiced." : "Flag removed.");
      setFlagTarget(null);
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setFlagBusy(false);
    }
  }

  function renderFlagButton(id: string, label: string, info: FlagInfo) {
    if (!canFlag) return null;
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={flagBusy}
              aria-label={info.flagged ? "Unflag" : "Mark as test data - do not invoice"}
              className={
                info.flagged ? "text-red-600/60 hover:text-red-600" : "text-muted-foreground"
              }
              onClick={() => {
                if (info.flagged) void setFlag(id, false, "");
                else {
                  setFlagReason("");
                  setFlagTarget({ id, label });
                }
              }}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {info.flagged
              ? `Flagged as test data${info.reason ? `: ${info.reason}` : ""} - click to unflag`
              : "Mark as test data - do not invoice"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  async function handleSendInvoice() {
    if (!sendTarget || sendInFlight.current) return;
    sendInFlight.current = true;
    setSending(true);
    try {
      const invoiceId = sendTarget.id;
      // Only a draft can become sent; the status filter makes a second submit a no-op instead of a re-post.
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId)
        .eq("status", "draft")
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("This invoice is no longer a draft.");

      await logAudit("invoices", invoiceId, "update", { status: "draft" }, { status: "sent" });
      toast.success("Invoice sent and posted to the ledger.");
      setSendTarget(null);
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : String(error));
      setSendTarget(null);
      await loadData();
    } finally {
      sendInFlight.current = false;
      setSending(false);
    }
  }

  function clientNameFor(inv: InvoiceRecord) {
    return inv.client_display_name || clientNames.get(inv.client_id) || null;
  }

  function toPayable(inv: InvoiceRecord): PayableInvoice {
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      total: Number(inv.total) || 0,
      client_id: inv.client_id,
      client_name: clientNameFor(inv),
      paid_so_far: paidByInvoice.get(inv.id) ?? 0,
    };
  }

  const visibleQuotations = availableQuotations.filter((q) => showFlagged || !q.do_not_invoice);
  const visibleInvoices = invoices.filter(
    (inv) => showFlagged || !invoiceFlags.get(inv.quotation_id)?.flagged,
  );
  const flaggedCount =
    availableQuotations.filter((q) => q.do_not_invoice).length +
    invoices.filter((inv) => invoiceFlags.get(inv.quotation_id)?.flagged).length;

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] font-bold leading-tight">Invoices</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create invoices from approved quotations. A draft invoice does not affect the ledger —
            only sending it does.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showFlagged}
            onChange={(e) => setShowFlagged(e.target.checked)}
          />
          Show flagged{flaggedCount > 0 ? ` (${flaggedCount})` : ""}
        </label>
      </div>

      {!loading && blockedProjects.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Completed jobs blocked from invoicing ({blockedProjects.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These jobs are marked completed but their quotation was never approved, so they can't
              be invoiced yet. This is not an accounts problem — chase whoever approves quotations.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockedProjects.map((p) => {
                const age = daysSince(p.completed_at);
                return (
                  <div
                    key={p.job_number}
                    className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-background p-3"
                  >
                    <div>
                      <div className="font-medium">
                        {p.job_number} — {p.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Quotation stuck at "{p.quotation_status}" • {p.grand_total.toFixed(2)}
                        {age !== null && ` • completed ${age} day${age === 1 ? "" : "s"} ago`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Approved quotations ready to invoice</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : visibleQuotations.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No approved quotations are waiting to be invoiced.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleQuotations.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      {q.project_title}
                      {q.project_status !== "completed" && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-700">
                          Approved but not yet completed
                        </Badge>
                      )}
                      {q.do_not_invoice && (
                        <Badge variant="outline" className="border-red-500/40 text-red-600/80">
                          Test data
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {q.client_display_name ? `${q.client_display_name} • ` : ""}
                      Total: {q.grand_total.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderFlagButton(q.id, q.project_title, {
                      flagged: q.do_not_invoice,
                      reason: q.do_not_invoice_reason,
                    })}
                    <Button onClick={() => openCreateDialog(q)} disabled={q.do_not_invoice}>
                      Create invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>All invoices</CardTitle>
            <CsvButton
              name="invoices"
              headers={[
                "Invoice",
                "Client",
                "Status",
                "Issued",
                "Due",
                "Subtotal",
                "VAT",
                "Total",
                "Paid",
                "Balance",
              ]}
              rows={visibleInvoices.map((inv) => {
                const paid = paidByInvoice.get(inv.id) ?? 0;
                return [
                  inv.invoice_number,
                  clientNameFor(inv),
                  inv.status,
                  inv.issue_date,
                  inv.due_date,
                  Number(inv.subtotal),
                  Number(inv.vat_amount),
                  Number(inv.total),
                  paid,
                  Math.round((Number(inv.total) - paid) * 100) / 100,
                ];
              })}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : visibleInvoices.length === 0 ? (
            <div className="text-sm text-muted-foreground">No invoices yet.</div>
          ) : (
            <div className="space-y-2">
              {visibleInvoices.map((inv) => {
                const flag = invoiceFlags.get(inv.quotation_id) ?? { flagged: false, reason: null };
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <div className="font-medium">{inv.invoice_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {inv.status} • Total: {Number(inv.total).toFixed(2)} • Issued{" "}
                        {new Date(inv.issue_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderFlagButton(inv.quotation_id, inv.invoice_number, flag)}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="PDF / print"
                        aria-label="PDF / print"
                        onClick={() =>
                          void printInvoice({
                            ...inv,
                            client_name: clientNameFor(inv),
                          }).catch((e: unknown) =>
                            toast.error(e instanceof Error ? e.message : String(e)),
                          )
                        }
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {isAdmin && flag.project_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Open project"
                          aria-label="Open project"
                        >
                          <Link
                            to="/project-viewer/$projectId"
                            params={{ projectId: flag.project_id }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {(inv.status === "sent" || inv.status === "partially_paid") && (
                        <Button variant="outline" onClick={() => setPaying(toPayable(inv))}>
                          <Wallet className="mr-1 h-4 w-4" />
                          Record payment
                        </Button>
                      )}
                      {inv.status === "draft" ? (
                        <Button
                          variant="outline"
                          onClick={() => setSendTarget(inv)}
                          disabled={flag.flagged || sending}
                        >
                          Send invoice
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground capitalize">
                          {inv.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        invoice={paying}
        onClose={() => setPaying(null)}
        onDone={() => loadData()}
      />

      <ConfirmDialog
        open={sendTarget !== null}
        title="Send invoice and post to the ledger?"
        description={`${sendTarget?.invoice_number ?? ""} for ${Number(sendTarget?.total ?? 0).toFixed(2)} will be marked as sent and posted to the general ledger (Accounts Receivable and revenue).`}
        confirmLabel="Send and post"
        busy={sending}
        onConfirm={() => void handleSendInvoice()}
        onCancel={() => setSendTarget(null)}
      />

      <Dialog
        open={flagTarget !== null}
        onOpenChange={(open) => !open && !flagBusy && setFlagTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as test data</DialogTitle>
            <DialogDescription>
              {flagTarget?.label} will be hidden from invoicing and cannot be invoiced or sent until
              unflagged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flagReason">Reason (optional)</Label>
              <Textarea
                id="flagReason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="e.g. demo job used for training"
              />
            </div>
            <Button
              className="w-full"
              disabled={flagBusy}
              onClick={() => flagTarget && void setFlag(flagTarget.id, true, flagReason)}
            >
              {flagBusy ? "Saving…" : "Mark as test data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={creating !== null} onOpenChange={(open) => !open && setCreating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>
              {creating?.client_display_name ? `${creating.client_display_name} — ` : ""}
              {creating?.project_title} — total {creating?.grand_total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invoice number is assigned automatically from Settings when you save.
            </p>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateInvoice} disabled={saving} className="w-full">
              {saving ? "Creating…" : "Create as draft"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
