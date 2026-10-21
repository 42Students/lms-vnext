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

  function remove(){
    if(inFlight.current||pending)return;
    inFlight.current=true;setError("");
    startTransition(async()=>{
      try{
        await apiFetch("/api/college/classes/"+encodeURIComponent(row.id),{
          method:"DELETE",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:row.updatedAt,confirm:true}),
        });
        setDeleting(false);
        showToast({tone:"success",title:"Class deleted successfully"});
        router.refresh();
      }catch(reason){
        setError(reason instanceof Error?reason.message:"Could not delete this class. Check enrollment, schedule and course dependencies.");
      }finally{inFlight.current=false;}
    });
  }

  return <div className="flex min-w-0 flex-wrap gap-2">
    <Button variant="secondary" type="button" disabled={pending}
      className="min-h-11 w-full sm:w-auto md:min-h-9"
      aria-label={(action === "ARCHIVE" ? "Archive" : "Restore")+" class "+row.name}
      onClick={() => { setError(""); setConfirming(true); }}>
      {pending ? "Saving…" : action === "ARCHIVE" ? "Archive" : "Restore"}
    </Button>
    <Button variant="danger" type="button" disabled={pending}
      title="Delete is available only when no enrollment, faculty, schedule or course history exists"
      onClick={()=>{setError("");setDeleting(true);}}>{pending?"Saving…":"Delete"}</Button>
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
    <ConfirmDialog open={deleting} onOpenChange={setDeleting}
      title="Delete this class?" confirmLabel="Delete class"
      confirmVariant="danger" pending={pending} onConfirm={remove}>
      <p className="text-sm text-body">Delete “{row.name}” permanently? Only allowed before any enrollment, faculty assignment, schedule or course delivery exists. Otherwise retain or archive the class.</p>
      {error?<Alert tone="error" className="mt-3">{error}</Alert>:null}
    </ConfirmDialog>
  </div>;
}
