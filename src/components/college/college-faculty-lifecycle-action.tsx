"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { facultyLifecycleConfirmation } from "@/modules/people/college-faculty-lifecycle-model";

export function CollegeFacultyLifecycleAction({ membershipId, name, status }: {
  membershipId: string; name: string; status: "ACTIVE" | "SUSPENDED" | "ENDED";
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success,setSuccess]=useState("");
  const [busy, start] = useTransition();
  const pendingRef = useRef(false);
  const reasonId=useId();
  function setOpen(next:boolean){
    if(busy)return;
    if(!next){setError("");setReason("");}
    else {setError("");setSuccess("");}
    setEditing(next);
  }
  if (status === "ENDED") return null;
  const action = status === "ACTIVE" ? "DEACTIVATE" : "REACTIVATE";
  function submit() {
    if (pendingRef.current || busy) return;
    if (action === "DEACTIVATE" && reason.trim().length < 3) {
      setError("A reason of at least 3 characters is required.");
      return;
    }

    pendingRef.current = true;
    setError("");setSuccess("");
    start(async () => {
      try {
        const response = await fetch(
          "/api/college/faculty/" + encodeURIComponent(membershipId) + "/lifecycle",
          { method: "PATCH", headers: { "content-type": "application/json" },
            body: JSON.stringify(action === "DEACTIVATE"
              ? { action, expectedStatus: "ACTIVE", reason: reason.trim(), confirm: true }
              : { action, expectedStatus: "SUSPENDED", confirm: true }),
          },
        );
        if (!response.ok) {
          const raw: unknown = await response.json().catch(() => null);
          const detail = raw && typeof raw === "object" ? raw as Record<string,unknown> : {};
          let guidance = response.status === 403
            ? "You do not have permission to change this faculty membership."
            : "Refresh the faculty directory and try again.";
          if (detail.error === "FACULTY_HAS_ACTIVE_PROJECTS") {
            const count = detail.activeMentorProjects;
            guidance = typeof count === "number" && Number.isSafeInteger(count) && count > 0
              ? "Cannot suspend this faculty member: they mentor "+count+
                " active project workspace(s). Reassign those projects to another mentor first."
              : "Cannot suspend this faculty member: active mentor projects remain. Reassign them to another mentor first.";
          } else if (detail.error === "FACULTY_STATUS_CHANGED") {
            guidance = "The faculty membership status changed. Refresh the directory before trying again.";
          } else if (detail.error === "FACULTY_HAS_ACTIVE_ASSIGNMENTS") {
            guidance = "The faculty member has active assignments that must be reassigned first.";
          } else if (detail.error === "NOT_FOUND") {
            guidance = "Faculty membership was not found in this college. Refresh the directory.";
          }
          throw new Error("Failed to "+(action==="DEACTIVATE"?"suspend":"reactivate")+" faculty: "+guidance);
        }
        setEditing(false);
        setReason("");
        setSuccess(action==="DEACTIVATE"?"Faculty suspended":"Faculty reactivated");
        router.refresh();
      } catch (reasonError) {
        setError(reasonError instanceof Error ? reasonError.message : "Failed to update faculty membership.");
      } finally {
        pendingRef.current = false;
      }
    });
  }
  return <div className="mt-[var(--lms-space-3)] min-w-0 space-y-[var(--lms-space-3)]">
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-center">
      <Button variant="secondary" type="button" onClick={() => setOpen(true)} disabled={busy}
        className="min-h-11 w-full sm:w-auto md:min-h-9">
        {action === "DEACTIVATE" ? "Suspend Faculty" : "Reactivate Faculty"}
      </Button>
      <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
        className="inline-flex min-h-11 w-full items-center justify-center text-xs font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Audit history</Link>
    </div>
    {success?<Alert tone="success">{success}</Alert>:null}
    {!editing && error?<Alert tone="error">{error}</Alert>:null}
    <ConfirmDialog open={editing} onOpenChange={setOpen}
      title={facultyLifecycleConfirmation(name,action)}
      description={action==="DEACTIVATE"
        ? "Suspension immediately blocks access through this college membership, but does not necessarily revoke sessions or block login through other active memberships. Data and history are preserved, and this action is reversible. Supply a reason before confirming."
        : "Reactivation restores access through this college membership. It does not change another membership or override platform-wide login restrictions."}
      confirmLabel={action==="DEACTIVATE"?"Confirm suspension":"Confirm reactivation"}
      confirmVariant={action==="DEACTIVATE"?"danger":"primary"} pending={busy}
      confirmDisabled={action==="DEACTIVATE"&&reason.trim().length<3}
      onConfirm={submit}>
      {action==="DEACTIVATE" || Boolean(error) ? <div className="space-y-3">
        {action==="DEACTIVATE"?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason
          <Input id={reasonId} maxLength={500} minLength={3} required value={reason} disabled={busy}
            aria-describedby={`${reasonId}-hint`} aria-invalid={Boolean(error)}
            onChange={e=>{setReason(e.target.value);if(error)setError("");}} className="min-h-11 w-full md:min-h-9"/>
          <span id={`${reasonId}-hint`} className="text-xs font-normal leading-5 text-body">At least 3 characters are required.</span>
        </label>:null}
        {error?<Alert tone="error">{error}</Alert>:null}
      </div> : null}
    </ConfirmDialog>
  </div>;
}
