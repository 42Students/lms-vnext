"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

export function ProjectArchiveControl({
  projectId,
  projectTitle,
  status,
  expectedUpdatedAt,
}: {
  projectId: string;
  projectTitle: string;
  status: string;
  expectedUpdatedAt: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);


  async function archive() {
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
        title: "Project archived",
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
      setPending(false);
    }
  }

  async function restore() {
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
      setPending(false);
    }
  }

  if (status === "ARCHIVED") {
    return (
      <>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Restore
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Restore this workspace?"
          description="Restore workspace, members, meetings, tasks, sprints and resources with their edits."
          footer={
            <>
              <Button variant="secondary" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={pending} onClick={() => void restore()}>Restore</Button>
            </>
          }
        >
          <p className="m-0 text-sm leading-6 text-body">
            Archived workspaces can be reopened with all of their content.
          </p>
        </Dialog>
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
        onOpenChange={setOpen}
        title="Archive project?"
        description={`${projectTitle} will be marked archived. The workspace remains accessible for review, but execution mutations are blocked.`}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() => void archive()}
            >
              {pending ? "Archiving…" : "Archive project"}
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm leading-6 text-body">
          This is an archive action, not the separate recoverable-delete workflow.
        </p>
      </Dialog>
    </>
  );
}
