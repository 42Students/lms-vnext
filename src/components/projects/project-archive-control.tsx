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
}: {
  projectId: string;
  projectTitle: string;
  status: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (status === "ARCHIVED") {
    return null;
  }

  async function archive() {
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/archive`,
        "POST",
      );
      setOpen(false);
      showToast({
        tone: "success",
        title: "Project archived",
        description:
          "The workspace remains available for review.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not archive project",
        description:
          error instanceof Error
            ? error.message
            : "The request could not be completed.",
      });
    } finally {
      setPending(false);
    }
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
