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

interface ProjectComment {
  id: string;
  title: string;
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

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedComment(null);
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
          if (!nextOpen) setSelectedComment(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedComment ?? "Project comments"}</DialogTitle>
            <DialogDescription>
              {selectedComment
                ? `${selectedProjects.length} project${selectedProjects.length === 1 ? "" : "s"} with this comment`
                : "Choose a comment to see its projects."}
            </DialogDescription>
          </DialogHeader>

          {selectedComment ? (
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              <Button variant="ghost" size="sm" onClick={() => setSelectedComment(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                All comments
              </Button>
              {selectedProjects.map((project) => (
                <div key={project.id} className="rounded-md border px-3 py-2 text-sm">
                  {project.title}
                </div>
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