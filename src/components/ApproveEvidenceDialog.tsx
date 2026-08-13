import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

interface Props {
  quotationId: string;
  projectId: string;
  onApproved: () => void;
}

export default function ApproveEvidenceDialog({ quotationId, projectId, onApproved }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (!file && !note.trim()) {
      toast.error("Attach a file or add a note as evidence of approval");
      return;
    }
    setBusy(true);
    try {
      let evidenceUrl: string | null = null;
      if (file) {
        const path = `evidence/${quotationId}-${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("project-images").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from("project-images").getPublicUrl(path);
        evidenceUrl = data.publicUrl;
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error: qErr } = await supabase
        .from("quotations")
        .update({
          status: "approved",
          approval_evidence_url: evidenceUrl,
          approval_evidence_note: note.trim() || null,
          approved_by: userData?.user?.id ?? null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", quotationId);
      if (qErr) throw qErr;

      const { error: pErr } = await supabase
        .from("projects")
        .update({ status: "approved" })
        .eq("id", projectId);
      if (pErr) throw pErr;

      toast.success("Quotation approved");
      setOpen(false);
      setFile(null);
      setNote("");
      onApproved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Could not approve: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm approval</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Attach evidence that this approval actually happened — a screenshot, a signed
            document, or a note. At least one is required.
          </p>
          <div>
            <Label htmlFor="evidence-file">Evidence file (image or document)</Label>
            <Input
              id="evidence-file"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <Label htmlFor="evidence-note">Or a confirmation note</Label>
            <Textarea
              id="evidence-note"
              placeholder='e.g. "Confirmed by phone with client, 2pm"'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirm approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
