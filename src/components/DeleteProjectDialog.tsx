import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DeleteProjectDialogProps {
  projectId: string;
  projectTitle: string;
  onDeleted?: () => void;
  children?: ReactNode;
}

interface RecipientRow {
  user_id: string;
  role: string;
}

function DeleteProjectDialog({
  projectId,
  projectTitle,
  onDeleted,
  children,
}: DeleteProjectDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [working, setWorking] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (!error && data.user) {
        setCurrentUserId(data.user.id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const confirmEnabled = confirmationText === projectTitle;

  async function handleDelete() {
    if (!currentUserId) {
      toast.error("Unable to verify your account.");
      return;
    }

    setWorking(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Unable to verify your account.");
      }

      const deletedBy = userData.user.id;
      const nowIso = new Date().toISOString();

      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "mini_admin"]);

      if (roleError) throw roleError;

      const recipients = Array.from(
        new Map(
          (roleRows ?? [])
            .filter((row: RecipientRow) => row.user_id && row.user_id !== deletedBy)
            .map((row: RecipientRow) => [row.user_id, row.role]),
        ).entries(),
      ).map(([userId, role]) => ({ userId, role }));

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("engineer_id")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError) throw projectError;

      if (projectData?.engineer_id && projectData.engineer_id !== deletedBy) {
        recipients.push({ userId: projectData.engineer_id, role: "engineer" });
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update({ archived: true, archived_at: nowIso, archived_by: deletedBy })
        .eq("id", projectId);

      if (updateError) throw updateError;

      const notificationRows = recipients.map((recipient) => ({
        user_id: recipient.userId,
        project_id: projectId,
        title: `Project deleted: ${projectTitle}`,
        body: `${userData.user.email ?? "A user"} archived this project on ${new Date(nowIso).toLocaleString()}`,
        link: determineRoute(recipient.role),
      }));

      if (notificationRows.length > 0) {
        const { error: notificationError } = await supabase.from("notifications").insert(notificationRows);
        if (notificationError) throw notificationError;
      }

      toast.success("Project archived and notifications sent.");
      setOpen(false);
      setConfirmationText("");
      if (onDeleted) onDeleted();
      else navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to archive project");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children ?? <Button variant="destructive">Delete project</Button>}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Archive this project?</DialogTitle>
              <DialogDescription>
                This will archive the project and remove it from active views.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            To confirm, type the project title exactly as shown below.
          </p>
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="font-medium">{projectTitle}</div>
          </div>
          <Input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={projectTitle}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!confirmEnabled || working} onClick={handleDelete}>
            {working ? "Archiving..." : "Confirm archive"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function determineRoute(role: string) {
  switch (role) {
    case "mini_admin":
      return "/mini-admin/Admin/Clients";
    case "engineer":
      return "/engineer";
    default:
      return "/admin";
  }
}

export default DeleteProjectDialog;
