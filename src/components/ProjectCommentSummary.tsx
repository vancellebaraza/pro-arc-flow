import { useState } from "react";
import { ArrowLeft, ChevronRight, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SERVICES } from "@/lib/services";

interface ProjectComment {
  id: string;
  title: string;
  service: string;
  location: string | null;
  engineer_name: string | null;
  scheduled_date: string | null;
  scheduled_end_date: string | null;
  quoted_amount: number | null;
  payment_status: string | null;
  work_comment: string | null;
}

interface Props {
  projects: ProjectComment[];
}

export default function ProjectCommentSummary({ projects }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);

  const comments = projects.reduce<Record<string, ProjectComment[]>>((groups, project) => {
    const comment = project.work_comment?.trim();
    if (!comment) return groups;
    (groups[comment] ??= []).push(project);
    return groups;
  }, {});
  const commentGroups = Object.entries(comments).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const selectedProjects = selectedComment ? comments[selectedComment] ?? [] : [];
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = selectedProjects.find((project) => project.id === selectedProjectId);
  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedComment(null);
          setSelectedProjectId(null);
          setOpen(true);
        }}
        className="rounded-xl border bg-card p-5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Project comments
            </div>
            <div className="mt-1 text-3xl font-semibold">
              {projects.filter((project) => project.work_comment?.trim()).length}
            </div>
          </div>
          <MessageSquareText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelectedComment(null);
            setSelectedProjectId(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title ?? selectedComment ?? "Project comments"}</DialogTitle>
            <DialogDescription>
              {selectedProject
                ? "Project details"
                : selectedComment
                ? `${selectedProjects.length} project${selectedProjects.length === 1 ? "" : "s"} with this comment`
                : "Choose a comment to see its projects."}
            </DialogDescription>
          </DialogHeader>

          {selectedProject ? (
            <div className="max-h-[55vh] space-y-3 overflow-y-auto">
              <Button variant="ghost" size="sm" onClick={() => setSelectedProjectId(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Projects with this comment
              </Button>
              <dl className="grid gap-x-4 gap-y-3 rounded-md border p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Scheduled date</dt>
                  <dd className="mt-1 font-medium">
                    {formatDate(selectedProject.scheduled_date)}
                    {selectedProject.scheduled_end_date
                      ? ` - ${formatDate(selectedProject.scheduled_end_date)}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Engineer assigned</dt>
                  <dd className="mt-1 font-medium">{selectedProject.engineer_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Project title</dt>
                  <dd className="mt-1 font-medium">{selectedProject.title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Service</dt>
                  <dd className="mt-1 font-medium">
                    {SERVICES.find((service) => service.key === selectedProject.service)?.label ??
                      selectedProject.service}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="mt-1 font-medium">{selectedProject.location || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Quoted amount</dt>
                  <dd className="mt-1 font-medium">
                    {selectedProject.quoted_amount == null
                      ? "—"
                      : `KES ${selectedProject.quoted_amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Payment status</dt>
                  <dd className="mt-1 font-medium">
                    {selectedProject.payment_status || "Unpaid"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : selectedComment ? (
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedComment(null);
                  setSelectedProjectId(null);
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                All comments
              </Button>
              {selectedProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {project.title}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : commentGroups.length ? (
            <div className="max-h-[55vh] space-y-1 overflow-y-auto">
              {commentGroups.map(([comment, commentProjects]) => (
                <Button
                  key={comment}
                  variant="ghost"
                  className="h-auto w-full justify-between gap-3 whitespace-normal py-3 text-left"
                  onClick={() => setSelectedComment(comment)}
                >
                  <span className="min-w-0 break-words">{comment}</span>
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    {commentProjects.length}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">There are no project comments yet.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}