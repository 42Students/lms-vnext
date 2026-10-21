"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { ProjectSoftDeleteControl } from "./project-soft-delete-control";

export function ProjectArchiveControl({
  projectId,
  projectTitle,
  status,
  expectedUpdatedAt,
  deleted = false,
}: {
  projectId: string;
  projectTitle: string;
  status: string;
  expectedUpdatedAt: string;
  deleted?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const inFlight=useRef(false);
  const onDialogOpenChange=(value:boolean)=>{if(!inFlight.current)setOpen(value);};


  async function archive() {
    // Two clicks before the next React paint are still a single mutation.
    if(inFlight.current)return;
    inFlight.current=true;
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${encodeURIComponent(projectId)}/archive`,
        "POST",
        {expectedUpdatedAt},
      );
      setOpen(false);
      showToast({
        tone: "success",
        title: "Workspace archived",
        description:
          "The workspace remains available for review.",
      });
      router.refresh();
    } catch {
      showToast({
        tone: "error",
        title: "Could not archive project",
        description: "This changed while you were working. Refresh and try again.",
      });
    } finally {
      inFlight.current=false;
      setPending(false);
    }
  }

  async function restore() {
    if(inFlight.current)return;
    inFlight.current=true;
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${encodeURIComponent(projectId)}/restore`,
        "POST",
        { expectedUpdatedAt },
      );
      setOpen(false);
      showToast({ tone: "success", title: "Workspace restored" });
      router.refresh();
    } catch {
      showToast({ tone: "error", title: "Failed to restore workspace" });
    } finally {
      inFlight.current=false;
      setPending(false);
    }
  }

  if (deleted) {
    return <ProjectSoftDeleteControl projectId={projectId} projectTitle={projectTitle}
      expectedUpdatedAt={expectedUpdatedAt} deleted />;
  }

  if (status === "ARCHIVED") {
    return (
      <>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Restore
        </Button>
        <Dialog
          open={open}
          onOpenChange={onDialogOpenChange}
          title="Restore this workspace?"
          description="Restore workspace, members, meetings, tasks, sprints and resources with their edits."
          footer={
            <div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" variant="secondary" disabled={pending} onClick={() => onDialogOpenChange(false)}>Cancel</Button>
              <Button className="w-full sm:w-auto" loading={pending} disabled={pending} onClick={() => void restore()}>Restore</Button>
            </div>
          }
        >
          <p className="m-0 max-w-prose break-words border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-[var(--lms-font-base)] leading-5 text-[var(--lms-body-text)]">
            Archived workspaces can be reopened with all of their content.
          </p>
        </Dialog>
        <ProjectSoftDeleteControl projectId={projectId} projectTitle={projectTitle}
          expectedUpdatedAt={expectedUpdatedAt} deleted={false} />
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        Archive
      </Button>
      <Dialog
        open={open}
        onOpenChange={onDialogOpenChange}
        title="Archive project?"
        description={`${projectTitle} will be marked archived. The workspace remains accessible for review, but execution mutations are blocked.`}
        footer={
          <div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" variant="secondary" disabled={pending} onClick={() => onDialogOpenChange(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" loading={pending} disabled={pending} onClick={() => void archive()}>
              {pending ? "Archiving…" : "Archive project"}
            </Button>
          </div>
        }
      >
        <p className="m-0 max-w-prose break-words border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-[var(--lms-font-base)] leading-5 text-[var(--lms-body-text)]">
          This is an archive action, not the separate recoverable-delete workflow.
        </p>
      </Dialog>
      <ProjectSoftDeleteControl projectId={projectId} projectTitle={projectTitle}
        expectedUpdatedAt={expectedUpdatedAt} deleted={false} />
    </>
  );
}
