"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

export function ProjectSoftDeleteControl({ projectId, projectTitle, expectedUpdatedAt, deleted }: {
  projectId: string;
  projectTitle: string;
  expectedUpdatedAt: string;
  deleted: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const deletedListHref = pathname.startsWith("/admin/") ? "/admin/projects/deleted" : "/college/projects/deleted";
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      await projectMutation(
        "/api/projects/" + encodeURIComponent(projectId) + (deleted ? "/undelete" : "/delete"),
        "POST", { expectedUpdatedAt },
      );
      setOpen(false);
      showToast({
        tone: "success",
        title: deleted ? "Deleted workspace restored" : "Workspace deleted — it can be restored",
        description: deleted
          ? "The workspace is still archived. Use Restore to reopen it for work."
          : "The workspace can be recovered from Deleted workspaces.",
      });
      if(deleted){router.refresh();}else{router.push(deletedListHref);router.refresh();}
    } catch (caught) {
      showToast({
        tone: "error",
        title: deleted ? "Could not restore deleted workspace" : "Could not delete workspace",
        description: caught instanceof Error ? caught.message : "The workspace may have changed. Refresh and retry.",
      });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <>
    <Button size="sm" variant="secondary" disabled={pending}
      onClick={() => setOpen(true)}>
      {deleted ? "Recover" : "Delete"}
    </Button>
    <Dialog open={open} onOpenChange={next => { if (!inFlight.current) setOpen(next); }}
      title={deleted ? "Restore deleted workspace?" : "Delete this workspace?"}
      description={deleted
        ? "Restore this workspace to the archived list without losing its content."
        : "This moves the workspace to Deleted workspaces. It is not permanently erased."}
      dismissible={!pending}
      footer={<div className="flex w-full flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
        <Button disabled={pending} loading={pending} onClick={() => void submit()}>
          {pending ? "Saving…" : deleted ? "Recover workspace" : "Delete workspace"}
        </Button>
      </div>}>
      <div className="space-y-3 text-sm leading-6 text-body">
        <p className="break-words font-semibold text-foreground">{projectTitle}</p>
        <p>
          {deleted
            ? "Members, tasks, sprints, resources and meetings are retained. The workspace remains archived until you restore it separately."
            : "The workspace will be soft-deleted and removed from ordinary project lists. Content is retained for authorized recovery."}
        </p>
        <Link href={deletedListHref}
          className="inline-flex min-h-9 items-center font-semibold text-link underline">
          View Deleted workspaces
        </Link>
      </div>
    </Dialog>
  </>;
}
