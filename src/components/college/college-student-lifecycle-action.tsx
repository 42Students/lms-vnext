"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function CollegeStudentLifecycleAction({ membershipId, name, status }: {
  membershipId: string; name: string; status: "ACTIVE" | "SUSPENDED" | "ENDED";
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const pendingRef = useRef(false);
  if (status === "ENDED") return null;
  const suspend = status === "ACTIVE";
  function confirm() {
    if (pendingRef.current || pending) return;
    if (suspend && reason.trim().length < 3) {
      setError("Suspension reason must be at least 3 characters."); return;
    }

    pendingRef.current = true;
    start(async () => {
      try {
        const response = await fetch("/api/people/" + encodeURIComponent(membershipId) + "/lifecycle", {
          method: "PATCH", headers: { "content-type": "application/json" },
          body: JSON.stringify(suspend ? { action: "SUSPEND", reason: reason.trim() }
            : { action: "REACTIVATE" }),
        });
        if (!response.ok) throw Error(response.status===409
          ? "This membership changed elsewhere. Refresh before retrying."
          : "Action refused. Check your access and try again.");
        setOpen(false); setReason(""); setError(""); router.refresh();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Action refused"); }
      finally { pendingRef.current = false; }
    });
  }
  return <div className="min-w-0 space-y-[var(--lms-space-2)]">
    <Button variant="secondary" type="button" disabled={pending} loading={pending}
      onClick={() => setOpen(true)} className="min-h-11 w-full sm:w-auto md:min-h-9">
      {suspend ? "Suspend" : "Reactivate"}
    </Button>
    {!open&&error?<Alert tone="error">{error}</Alert>:null}
    <ConfirmDialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}
      title={(suspend?"Suspend ":"Reactivate ")+name+"?"}
      description={suspend?"Provide a reason for restricting the student's college access.":"Restore this student's college access?"}
      confirmLabel={suspend?"Confirm suspension":"Confirm reactivation"}
      confirmVariant={suspend?"danger":"primary"} pending={pending}
      confirmDisabled={suspend&&reason.trim().length<3}
      onConfirm={confirm}>
      <div className="min-w-0 space-y-[var(--lms-space-3)]">
        {suspend?<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason
          <Input className="min-h-11 w-full md:min-h-9" maxLength={500} value={reason} disabled={pending} onChange={event=>setReason(event.target.value)}/>
        </label>:<p className="max-w-prose break-words text-sm leading-5 text-body">Restore access for this student membership?</p>}
        {error?<Alert tone="error">{error}</Alert>:null}
      </div>
    </ConfirmDialog>
  </div>;
}
