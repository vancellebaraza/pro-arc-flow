import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: string;
  projectTitle?: string;
}

interface Observation {
  observation?: string;
  action?: string;
}

interface Signatures {
  technician_name?: string;
  supervisor_name?: string;
  client_name?: string;
}

interface WorksheetDetail {
  client_name: string | null;
  job_no: string | null;
  job_location: string | null;
  job_date: string | null;
  job_type: string | null;
  technician: string | null;
  person_in_charge: string | null;
  job_description: string | null;
  observations: unknown;
  images_before: unknown;
  signatures: unknown;
}

function asObservations(value: unknown): Observation[] {
  return Array.isArray(value) ? (value as Observation[]) : [];
}

function asImages(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asSignatures(value: unknown): Signatures {
  return value && typeof value === "object" ? (value as Signatures) : {};
}

function displayValue(value: string | null) {
  return value?.trim() || "—";
}

export default function WorksheetDetailsDialog({ projectId, projectTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [worksheet, setWorksheet] = useState<WorksheetDetail | null>(null);

  async function handleOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen || worksheet) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("worksheets")
        .select(
          "client_name,job_no,job_location,job_date,job_type,technician,person_in_charge,job_description,observations,images_before,signatures",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setWorksheet(data as WorksheetDetail | null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load worksheet");
    } finally {
      setLoading(false);
    }
  }

  const observations = asObservations(worksheet?.observations);
  const images = asImages(worksheet?.images_before);
  const signatures = asSignatures(worksheet?.signatures);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          Worksheet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job worksheet{projectTitle ? ` — ${projectTitle}` : ""}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading worksheet…
          </div>
        ) : !worksheet ? (
          <p className="text-sm text-muted-foreground">
            No worksheet has been submitted for this project.
          </p>
        ) : (
          <div className="space-y-6 text-sm">
            <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Client:</span>{" "}
                {displayValue(worksheet.client_name)}
              </div>
              <div>
                <span className="text-muted-foreground">Job no.:</span>{" "}
                {displayValue(worksheet.job_no)}
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                {displayValue(worksheet.job_location)}
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                {displayValue(worksheet.job_date)}
              </div>
              <div>
                <span className="text-muted-foreground">Job type:</span>{" "}
                {displayValue(worksheet.job_type)}
              </div>
              <div>
                <span className="text-muted-foreground">Technician:</span>{" "}
                {displayValue(worksheet.technician)}
              </div>
              <div>
                <span className="text-muted-foreground">Person in charge:</span>{" "}
                {displayValue(worksheet.person_in_charge)}
              </div>
            </div>

            <section>
              <h3 className="font-semibold">Job description</h3>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {displayValue(worksheet.job_description)}
              </p>
            </section>

            <section>
              <h3 className="font-semibold">Observations and actions</h3>
              {observations.length === 0 ? (
                <p className="mt-2 text-muted-foreground">No observations recorded.</p>
              ) : (
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <table className="w-full text-left">
                    <thead className="bg-surface">
                      <tr>
                        <th className="p-3">Observation</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {observations.map((item, index) => (
                        <tr key={index} className="border-t align-top">
                          <td className="p-3 whitespace-pre-wrap">{item.observation || "—"}</td>
                          <td className="p-3 whitespace-pre-wrap">{item.action || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h3 className="font-semibold">Before images</h3>
              {images.length === 0 ? (
                <p className="mt-2 text-muted-foreground">No images uploaded.</p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-lg border"
                    >
                      <img
                        src={url}
                        alt={`Worksheet before image ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="font-semibold">Sign-off</h3>
              <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-3">
                <div>Technician: {displayValue(signatures.technician_name ?? null)}</div>
                <div>Supervisor: {displayValue(signatures.supervisor_name ?? null)}</div>
                <div>Client: {displayValue(signatures.client_name ?? null)}</div>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
