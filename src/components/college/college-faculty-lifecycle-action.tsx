"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRef, useState, useTransition } from "react";
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
        if (!response.ok) throw new Error(
          "Change denied. Resolve existing teaching responsibilities or refresh the directory.",
        );
        setEditing(false);
        setReason("");
        setSuccess(action==="DEACTIVATE"?"Faculty suspended.":"Faculty reactivated.");
        router.refresh();
      } catch (reasonError) {
        setError(reasonError instanceof Error ? reasonError.message : "Action failed");
      } finally {
        pendingRef.current = false;
      }
    });
  }
  return <div className="mt-2 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
        className="inline-flex min-h-11 items-center text-xs font-semibold text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Audit history</Link>
      <Button variant="secondary" type="button" onClick={() => setEditing(true)} disabled={busy}
        className="min-h-11 md:min-h-9">
        {action === "DEACTIVATE" ? "Suspend Faculty" : "Reactivate Faculty"}
      </Button>
    </div>
    {success?<Alert tone="success">{success}</Alert>:null}
    {!editing && error?<Alert tone="error">{error}</Alert>:null}
    <ConfirmDialog open={editing} onOpenChange={next=>{if(!busy)setEditing(next);}}
      title={facultyLifecycleConfirmation(name,action)}
      description={action==="DEACTIVATE"?"Supply the suspension reason before confirming.":"Restore access for this faculty membership?"}
      confirmLabel={action==="DEACTIVATE"?"Confirm suspension":"Confirm reactivation"}
      confirmVariant={action==="DEACTIVATE"?"danger":"primary"} pending={busy}
      confirmDisabled={action==="DEACTIVATE"&&reason.trim().length<3}
      onConfirm={submit}>
      <div className="space-y-3">
        {action==="DEACTIVATE"?<label className="grid gap-1 text-sm font-semibold text-body">Reason
          <Input maxLength={500} value={reason} disabled={busy}
            onChange={e=>setReason(e.target.value)}/>
        </label>:<p className="text-sm text-body">Restore access for this faculty membership?</p>}
        {error?<Alert tone="error">{error}</Alert>:null}
      </div>
    </ConfirmDialog>
  </div>;
}
