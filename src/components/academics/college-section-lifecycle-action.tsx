"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import {useToast} from "@/components/ui/toast";
import { classLifecyclePrompt } from "@/modules/academics/college-section-lifecycle-model";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

export function CollegeSectionLifecycleAction({ row }: {
  row: { id: string; name: string; status: "ACTIVE" | "ARCHIVED"; updatedAt: string; canDelete?: boolean };
}) {
  const router = useRouter();
  const {showToast}=useToast();
  const inFlight = useRef(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete,setConfirmingDelete] = useState(false);
  const action = row.status === "ACTIVE" ? "ARCHIVE" : "RESTORE";

  function change() {
    if (inFlight.current || pending) return;
    inFlight.current = true;
    setError("");
    startTransition(async () => {
      try {
        await apiFetch("/api/college/classes/" + encodeURIComponent(row.id) + "/lifecycle", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, expectedUpdatedAt: row.updatedAt, confirm: true }),
        });
        setConfirming(false);
        showToast({tone:"success",title:action==="ARCHIVE"
         ?'Archived class “'+row.name+'”.':'Restored class “'+row.name+'”.',
         description:action==="ARCHIVE"
          ?"Historical class records remain available and this class can be restored.":undefined});
        router.refresh();
      } catch (reason) {
        // Preserve distinct learner, timetable, teaching and delivery blockers.
        const code = reason instanceof FriendlyFetchError ? reason.code : null;
        setError(academicSetupErrorMessage(code ?? reason,
          "We couldn't update this class. Please retry."));
      } finally {
        inFlight.current = false;
      }
    });
  }

  function remove() {
    if (inFlight.current || pending || !row.canDelete) return;
    inFlight.current = true;
    setError("");
    startTransition(async () => {
      try {
        await apiFetch("/api/college/classes/" + encodeURIComponent(row.id), { method:"DELETE" });
        setConfirmingDelete(false);
        showToast({ tone:"success",title:'Deleted class “'+row.name+'”.' });
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Failed to delete class. Retry delete.");
      } finally { inFlight.current = false; }
    });
  }

  function deleteClass() {
    if (inFlight.current || pending) return;
    inFlight.current = true;
    setError("");
    startTransition(async () => {
      try {
        await apiFetch("/api/college/classes/" + encodeURIComponent(row.id), {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ expectedUpdatedAt: row.updatedAt, confirm: true }),
        });
        setDeleting(false);
        showToast({tone: "success", title: 'Deleted class “' + row.name + '”.'});
        router.refresh();
      } catch (reason) {
        const message = academicSetupErrorMessage(reason, "Failed to delete class.");
        setError(message);
        showToast({tone: "error", title: "Failed to delete class.", description: message});
      } finally {
        inFlight.current = false;
      }
    });
  }

  return <div className="flex min-w-0 flex-wrap items-center gap-2">
    <Button variant="secondary" type="button" disabled={pending}
      className="min-h-11 w-full sm:w-auto md:min-h-9"
      aria-label={(action === "ARCHIVE" ? "Archive" : "Restore")+" class "+row.name}
      onClick={() => { setError(""); setConfirming(true); }}>
      {pending ? "Saving…" : action === "ARCHIVE" ? "Archive" : "Restore"}
    </Button>
    {row.status === "ACTIVE" && row.canDelete ? <Button variant="secondary" type="button"
      disabled={pending} aria-label={"Delete class "+row.name}
      title="Delete only if no student, faculty, session or course depends on this class"
      onClick={() => { setError(""); setConfirmingDelete(true); }}
      className="min-h-11 w-full sm:w-auto md:min-h-9">Delete</Button> : null}
    <ConfirmDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}
      title={'Delete class “'+row.name+'”?'}
      description="This permanently deletes an empty class. Classes with students, meetings or teaching records cannot be deleted."
      confirmLabel="Delete class" confirmVariant="danger"
      pending={pending} onConfirm={remove}>
      {error ? <Alert tone="error" className="mt-3">{error}</Alert> : null}
    </ConfirmDialog>
    <ConfirmDialog open={confirming} onOpenChange={setConfirming}
      title={action === "ARCHIVE" ? "Archive class" : "Restore class"}
      description={classLifecyclePrompt(row.name, action)}
      confirmLabel={action === "ARCHIVE" ? "Archive class" : "Restore class"}
      confirmVariant={action === "ARCHIVE" ? "danger" : "primary"}
      pending={pending} onConfirm={change}>
      <p className="mb-2 text-xs text-muted-foreground">
        {action === "ARCHIVE"
          ? "Unlike the old Delete action, this preserves historical student, timetable and activity records. College academic administrators can restore the class later."
          : "Restoring makes the class available again only if its batch and academic period are still valid."}
      </p>
      {error ? <Alert tone="error" title="Class could not be updated" className="mt-3">{error}</Alert> : null}
    </ConfirmDialog>
  </div>;
}
