
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES, STATUS_LABEL } from "@/lib/services";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  ClipboardList,
  GitCompare,
  MessageSquare,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";
import { generateProjectPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/mini-admin/Engineer/$projectId")({
  component: EngineerProjectHub,
});

interface Project {
  id: string;
  title: string;
  service: string;
  status: string;
  description: string | null;
  location: string | null;
  engineer_id: string | null;
  client_id: string;
  scheduled_date: string | null;
  image_urls: string[];
}

function EngineerProjectHub() {
  const { projectId } = Route.useParams();
  console.log(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
    setProject(data as Project | null);
    setLoading(false);
  }, [projectId]);
  useEffect(() => {
    load();
  }, [load]);

  async function claim() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !project) return;
    await supabase.from("projects").update({ engineer_id: u.user.id }).eq("id", project.id);
    toast.success("Assigned to you");
    load();
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!project) return <div className="p-8 text-sm">Project not found.</div>;

  const svc = SERVICES.find((s) => s.key === project.service);
  const waText = `FusionPro engineer here regarding "${project.title}" (Ref ${project.id.slice(0, 8)}). `;

  async function logWa() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("whatsapp_logs").insert({
      sender_id: u.user.id,
      project_id: project!.id,
      body: waText,
    });
  }


async function downloadProjectReport() {
  if (!project) return;

  try {
    toast.loading("Generating project report...", {
      id: "project-report",
    });

    // Load quotation first because quotation_items depends on quotation.id
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (quotationError) throw quotationError;

const [
  { data: quotationItems, error: quotationItemsError },
  { data: inspections, error: inspectionError },
  { data: worksheets, error: worksheetError },
] = await Promise.all([
  quotation
    ? supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotation.id)
        .order("sort_order")
    : Promise.resolve({ data: [], error: null }),

  supabase
    .from("inspections")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1),

  supabase
    .from("worksheets")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1),
]);


    if (quotationItemsError) throw quotationItemsError;
    if (inspectionError) throw inspectionError;
    if (worksheetError) throw worksheetError;

    const inspection = inspections?.[0] ?? null;
    const worksheet = worksheets?.[0] ?? null;

    const quotationMeta = (quotation?.meta ?? {}) as {
      bill_to?: string;
      recipient?: string;
      for_text?: string;
      authorised_by?: string;
      date?: string;
    };

    const inspectionMeta = (inspection?.meta ?? {}) as {
      work_category?: string;
      client_name?: string;
      inspection_date?: string;
      inspector_name?: string;
      technician?: string;
    };

    const inspectionSignatures = (inspection?.signatures ?? {}) as {
      client_name?: string;
      inspector_name?: string;
      technician_name?: string;
    };

    const worksheetSignatures = (worksheet?.signatures ?? {}) as {
      technician_name?: string;
      supervisor_name?: string;
      client_name?: string;
    };

    await generateProjectPdf({
      project,

      quotation: {
        projectTitle: project.title,
        service: project.service,
        location: project.location,

        billTo: quotationMeta.bill_to ?? "",
        quoteNo: quotation?.quote_no ?? "",
        date: quotationMeta.date ?? "",
        to: quotationMeta.recipient ?? "",
        forText: quotationMeta.for_text ?? "",

        items:
          quotationItems?.map((item) => ({
            description: item.description,
            unit: item.unit,
            qty: Number(item.qty),
            unit_cost: Number(item.unit_cost),
            amount: Number(item.amount),
          })) ?? [],

        labour: Number(quotation?.labour ?? 0),
        subtotal: Number(quotation?.subtotal ?? 0),
        grandTotal: Number(quotation?.grand_total ?? 0),

        authorisedBy: quotationMeta.authorised_by ?? "",
        notes: quotation?.notes ?? "",
      },

      inspection: {
        workCategory: inspectionMeta.work_category ?? "",
        projectName: project.title,
        clientName: inspectionMeta.client_name ?? "",
        siteLocation: project.location ?? "",
        inspectionDate: inspectionMeta.inspection_date ?? "",
        inspectorName: inspectionMeta.inspector_name ?? "",
        technician: inspectionMeta.technician ?? "",

        checklist:
          (inspection?.checklist as {
            item: string;
            remark: string;
            pass: boolean;
          }[]) ?? [],

        photoEvidence:
          (inspection?.photo_evidence as {
            before: string;
            during: string;
            after: string;
          }[]) ?? [],

        //  inspection?.remarks ?? "",

        signatures: inspectionSignatures,
      },

      worksheet: {
        clientName: worksheet?.client_name ?? "",
        jobNo: worksheet?.job_no ?? "",
        jobLocation: worksheet?.job_location ?? "",
        jobDate: worksheet?.job_date ?? "",
        jobType: worksheet?.job_type ?? "",
        technician: worksheet?.technician ?? "",
        personInCharge: worksheet?.person_in_charge ?? "",
        jobDescription: worksheet?.job_description ?? "",

        observations:
          (worksheet?.observations as {
            observation: string;
            action: string;
          }[]) ?? [],

        imagesBefore:
          (worksheet?.images_before as string[]) ?? [],

        signatures: worksheetSignatures,
      },
    });

    toast.success("Project report downloaded.", {
      id: "project-report",
    });
  } catch (error) {
    console.error(error);

    toast.error(
      error instanceof Error ? error.message : "Failed to generate report",
      {
        id: "project-report",
      }
    );
  }
}



  const tools: Array<{
    to:
      | "/mini-admin/Engineer/$projectId/inspection"
      | "/mini-admin/Engineer/$projectId/quotation"
      | "/mini-admin/Engineer/$projectId/worksheet"
      | "/mini-admin/Engineer/$projectId/compare"
      | "/mini-admin/Engineer/$projectId/messages";
    title: string;
    desc: string;
    icon: typeof FileText;
  }> = [
    {
      to: "/mini-admin/Engineer/$projectId/inspection",
      title: "Inspection report",
      desc: "Checklist, photos, sign-off.",
      icon: ClipboardCheck,
    },
    {
      to: "/mini-admin/Engineer/$projectId/quotation",
      title: "Quotation",
      desc: "Bill-to, line items, totals & bank details.",
      icon: FileText,
    },
    {
      to: "/mini-admin/Engineer/$projectId/worksheet",
      title: "Job worksheet",
      desc: "Document 2 — site observations & sign-off.",
      icon: ClipboardList,
    },
    {
      to: "/mini-admin/Engineer/$projectId/compare",
      title: "Quoted vs Actual",
      desc: "Compare estimated vs actual costs.",
      icon: GitCompare,
    },
    {
      to: "/mini-admin/Engineer/$projectId/messages",
      title: "Communication",
      desc: "Internal messages & WhatsApp log.",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="p-4 md:p-8 fade-in max-w-5xl mx-auto">
      <Link
        to="/engineer"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to projects
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {svc?.label} · {STATUS_LABEL[project.status] ?? project.status}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1 truncate">
            {project.title}
          </h1>
          <p className="text-muted-foreground mt-1">{project.location ?? "—"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!project.engineer_id && (
            <Button size="sm" onClick={claim}>
              Assign to me
            </Button>
          )}
          <WhatsAppButton
            projectId={project.id}
            recipientRole="client"
            messageType="custom"
            customMessage={waText}
            className=""
          />
        </div>
      </div>

      {project.description && <p className="mt-5 text-sm leading-relaxed">{project.description}</p>}

      {project.image_urls?.length > 0 && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
          {project.image_urls.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer">
              <img
                src={u}
                className="rounded border h-28 w-full object-cover"
                alt={`Attachment ${i + 1}`}
              />
            </a>
          ))}
        </div>
      )}
           <Button onClick={downloadProjectReport}>
    <FileText className="mr-2 h-4 w-4" />
    Download Project Report
</Button>
      <h2 className="mt-10 text-lg font-semibold tracking-tight">Forms & tools</h2>
      <p className="text-sm text-muted-foreground">
        Each form opens in its own page so you have room to work.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.to}>
            <Link
              to={t.to}
              params={{ projectId: project.id }}
              className="flex items-start gap-3 rounded-xl border bg-card p-5 hover:border-foreground/40 hover:shadow-sm transition"
            >
              <div className="grid h-10 w-10 place-items-center rounded-md bg-foreground/5 shrink-0">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{t.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
