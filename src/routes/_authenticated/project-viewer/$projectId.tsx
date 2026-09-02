import { createFileRoute, Link } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, SERVICES } from "@/lib/services";
import { toast } from "sonner";
import { ArrowLeft, FileDown } from "lucide-react";
import { generateQuotationPdf, generateWorksheetPdf } from "@/lib/pdf";
import ProjectProgress from "@/components/ProjectProgress";

export const Route = createFileRoute("/_authenticated/project-viewer/$projectId")({
  component: ProjectViewerDetail,
});

interface Project {
  id: string;
  title: string;
  service: string;
  status: string;
  description: string | null;
  location: string | null;
  image_urls: string[];
}
interface Quotation {
  id: string;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  status: string;
  notes: string | null;
  created_at: string;
}
interface Item {
  id: string;
  type: "item" | "subtitle";
  description: string;
  unit?: string | null;
  qty: number;
  unit_cost: number;
  amount: number;
  sort_order: number;
}
interface Inspection {
  id: string;
  stage: string;
  checklist: Array<{ item: string; pass: boolean; remark?: string }>;
  remarks: string | null;
  created_at: string;
  image_urls: string[];
  signatures: Record<string, string> | null;
}

interface Worksheet {
  id: string;
  job_no: string | null;
  job_location: string | null;
  job_date: string | null;
  job_type: string | null;
  technician: string | null;
  person_in_charge: string | null;
  job_description: string | null;
  observations: Array<{ observation: string; action: string }> | null;
  images_before: string[] | null;
  signatures: { technician_name?: string; supervisor_name?: string; client_name?: string } | null;
  created_at: string;
}

function ProjectViewerDetail() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: p } = await supabase
      .from("projects")
      .select("id,title,service,status,description,location,image_urls")
      .eq("id", projectId)
      .maybeSingle();
    setProject(p as Project | null);

    const { data: q } = await supabase
      .from("quotations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    setQuote(q as Quotation | null);
    if (q) {
      const { data: it } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", q.id)
        .order("sort_order");
      setItems(
        ((it ?? []) as Array<{
          id: string;
          description: string;
          unit: string | null;
          qty: number;
          unit_cost: number;
          amount: number;
          sort_order: number;
        }>).map((item) => ({
          id: item.id,
          type: "item" as const,
          description: item.description,
          unit: item.unit,
          qty: Number(item.qty),
          unit_cost: Number(item.unit_cost),
          amount: Number(item.amount),
          sort_order: item.sort_order,
        })),
      );
    }

    const { data: ins } = await supabase
      .from("inspections")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setInspections((ins ?? []) as unknown as Inspection[]);

    const { data: ws } = await supabase
      .from("worksheets")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    setWorksheet(ws as unknown as Worksheet | null);

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function downloadWorksheet() {
    const { data: ws, error } = await supabase
      .from("worksheets")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (error) return toast.error(error.message);
    if (!ws) return toast.error("No job worksheet has been created for this project yet");
    try {
      const doc = new jsPDF();
      await generateWorksheetPdf(doc, {
        clientName: ws.client_name ?? "",
        jobNo: ws.job_no ?? "",
        jobLocation: ws.job_location ?? "",
        jobDate: ws.job_date ?? "",
        jobType: ws.job_type ?? "",
        technician: ws.technician ?? "",
        personInCharge: ws.person_in_charge ?? "",
        jobDescription: ws.job_description ?? "",
        observations: (ws.observations as any) ?? [],
        imagesBefore: (ws.images_before as any) ?? [],
        signatures: (ws.signatures as any) ?? {},
      });
      doc.save(`Worksheet-${(ws.job_no || "job").replace(/\W+/g, "_")}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    }
  }

  async function downloadPdf() {
    if (!quote || !project) return;
    try {
      const labour = items.reduce((sum, it) => sum + Number(it.amount), 0);
      const doc = new jsPDF();
      await generateQuotationPdf(doc, {
        projectTitle: project.title,
        service: SERVICES.find((s) => s.key === project.service)?.label ?? project.service,
        location: project.location,
        quoteNo: quote.id.slice(0, 8).toUpperCase(),
        billTo: project.title,
        date: new Date(quote.created_at).toLocaleDateString(),
        items,
        labour,
        vatRate: Number(quote.vat_rate ?? 0),
        vatAmount: Number(quote.vat_amount ?? 0),
        subtotal: Number(quote.subtotal),
        grandTotal: Number(quote.grand_total),
        notes: quote.notes,
      });
      doc.save(`Quotation-${(quote.id.slice(0, 8).toUpperCase() || "draft").replace(/\W+/g, "_")}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!project) return <div className="p-8 text-sm">Project not found, or not assigned to you.</div>;
  const svc = SERVICES.find((s) => s.key === project.service);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto fade-in">
      <div className="flex items-center justify-between">
        <Link
          to="/project-viewer"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <span>{svc?.label}</span>·<span>{STATUS_LABEL[project.status] ?? project.status}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">{project.title}</h1>
        <p className="text-muted-foreground mt-1">{project.location}</p>
      </div>

      <ProjectProgress status={project.status} className="mt-6" />

      {project.description && <p className="mt-6 text-sm leading-relaxed">{project.description}</p>}

      {project.image_urls.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {project.image_urls.map((u, i) => (
              <a
              key={i}
              href={u}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md overflow-hidden border bg-card"
            >
              <img src={u} alt={`attachment ${i + 1}`} className="w-full h-40 object-cover" />
            </a>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Inspection reports</h2>
        {inspections.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">No inspections yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {inspections.map((ins) => (
              <li key={ins.id} className="rounded-lg border bg-card p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{ins.stage} inspection</span>
                  <span className="text-muted-foreground">
                    {new Date(ins.created_at).toLocaleDateString()}
                  </span>
                </div>
                {Array.isArray(ins.checklist) && ins.checklist.length > 0 && (
                  <ul className="mt-3 text-sm space-y-1">
                    {ins.checklist.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={c.pass ? "text-green-700" : "text-destructive"}>
                          {c.pass ? "✓" : "✕"}
                        </span>
                        {c.item}
                        {c.remark && <span className="text-muted-foreground"> — {c.remark}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {ins.remarks && <p className="mt-2 text-sm text-muted-foreground">{ins.remarks}</p>}
                {Array.isArray(ins.image_urls) && ins.image_urls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {ins.image_urls.map((u, i) => (
                      <a key={i} href={u} target="_blank" rel="noreferrer">
                        <img
                          src={u}
                          alt={`Inspection photo ${i + 1}`}
                          className="rounded border h-20 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                {ins.signatures && Object.keys(ins.signatures).length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Signed by: {Object.entries(ins.signatures).map(([role, name]) => `${role}: ${name}`).join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Job worksheet / report</h2>
          {worksheet && (
            <Button variant="outline" size="sm" onClick={downloadWorksheet}>
              <FileDown className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
          )}
        </div>
        {!worksheet ? (
          <p className="text-sm text-muted-foreground mt-2">No job worksheet has been created yet.</p>
        ) : (
          <div className="mt-3 rounded-lg border bg-card p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Job no.</div>
                <div>{worksheet.job_no || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Job date</div>
                <div>{worksheet.job_date || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Job type</div>
                <div>{worksheet.job_type || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Technician</div>
                <div>{worksheet.technician || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Person in charge</div>
                <div>{worksheet.person_in_charge || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Location</div>
                <div>{worksheet.job_location || "—"}</div>
              </div>
            </div>

            {worksheet.job_description && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Description</div>
                <p className="text-sm leading-relaxed">{worksheet.job_description}</p>
              </div>
            )}

            {Array.isArray(worksheet.observations) && worksheet.observations.some((o) => o.observation) && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Observations & actions taken</div>
                <ul className="text-sm space-y-2">
                  {worksheet.observations
                    .filter((o) => o.observation)
                    .map((o, i) => (
                      <li key={i} className="rounded-md border bg-surface p-3">
                        <div>{o.observation}</div>
                        {o.action && (
                          <div className="text-muted-foreground mt-1">Action: {o.action}</div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {Array.isArray(worksheet.images_before) && worksheet.images_before.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Photos</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {worksheet.images_before.map((u, i) => (
                    <a
                      key={i}
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-md overflow-hidden border bg-card"
                    >
                      <img src={u} alt={`worksheet photo ${i + 1}`} className="w-full h-32 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {worksheet.signatures &&
              (worksheet.signatures.technician_name ||
                worksheet.signatures.supervisor_name ||
                worksheet.signatures.client_name) && (
                <div className="grid grid-cols-3 gap-3 text-sm border-t pt-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Technician</div>
                    <div>{worksheet.signatures.technician_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Supervisor</div>
                    <div>{worksheet.signatures.supervisor_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Client</div>
                    <div>{worksheet.signatures.client_name || "—"}</div>
                  </div>
                </div>
              )}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Quotation</h2>
          {quote && (
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <FileDown className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
          )}
        </div>
        {!quote ? (
          <p className="text-sm text-muted-foreground mt-2">No quotation yet.</p>
        ) : (
          <div className="mt-3 rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-3">{it.description}</td>
                    <td className="p-3 text-right">{it.qty}</td>
                    <td className="p-3 text-right">{Number(it.unit_cost).toFixed(2)}</td>
                    <td className="p-3 text-right">{Number(it.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t p-4 text-sm space-y-1 flex flex-col items-end">
              <div>
                Subtotal: <strong>{Number(quote.subtotal).toFixed(2)}</strong>
              </div>
              <div>
                VAT ({quote.vat_rate}%): <strong>{Number(quote.vat_amount).toFixed(2)}</strong>
              </div>
              <div className="text-base">
                Grand total: <strong>{Number(quote.grand_total).toFixed(2)}</strong>
              </div>
            </div>
            <div className="border-t p-3 text-xs text-muted-foreground text-right capitalize">
              Status: {quote.status}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
