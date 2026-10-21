"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import Link from "next/link";

export function CollegeStudentLifecycleAction({ membershipId, name, status }: {
  membershipId: string; name: string; status: "ACTIVE" | "SUSPENDED" | "ENDED";
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success,setSuccess]=useState("");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const pendingRef = useRef(false);
  const reasonId=useId();
  if (status === "ENDED") return null;
  const suspend = status === "ACTIVE";
  function confirm() {
    if (pendingRef.current || pending) return;
    if (suspend && reason.trim().length < 3) {
      setError("Suspension reason must be at least 3 characters."); return;
    }

    pendingRef.current = true;
    setSuccess("");
    start(async () => {
      try {
        const response = await fetch("/api/people/" + encodeURIComponent(membershipId) + "/lifecycle", {
          method: "PATCH", headers: { "content-type": "application/json" },
          body: JSON.stringify(suspend ? { action: "SUSPEND", reason: reason.trim() }
            : { action: "REACTIVATE" }),
        });
        if (!response.ok) {
          const details:unknown=await response.json().catch(()=>null);
          const payload=details&&typeof details==="object"?details as Record<string,unknown>:{};
          const safeReason=typeof payload.message==="string"&&payload.message.length<=200
            ?payload.message:"";
          const reason=response.status===401 ? "Sign in again to change student access."
            : response.status===409
            ? "This membership changed elsewhere. Refresh before retrying."
            : response.status===404?"Student membership not found. Refresh the directory."
            : response.status===403?"You do not have permission to change this student."
            : safeReason || "Action refused. Check your access and try again.";
          throw Error("Failed to "+(suspend?"suspend":"reactivate")+" student: "+reason);
        }
        setOpen(false); setReason(""); setError("");
        setSuccess(suspend?"Student suspended":"Student reactivated");
        router.refresh();
      } catch (cause) { setError(cause instanceof TypeError ? "Unable to reach the server. Check your connection and retry." : cause instanceof Error ? cause.message : "Action refused"); }
      finally { pendingRef.current = false; }
    });
  }
  return <div className="min-w-0 space-y-[var(--lms-space-2)]">
    <Button variant="secondary" type="button" disabled={pending} loading={pending}
      aria-label={(suspend?"Suspend Student ":"Reactivate Student ")+name}
      title={(suspend?"Suspend Student ":"Reactivate Student ")+name}
      onClick={() => {setSuccess("");setOpen(true);}} className="min-h-11 w-full sm:w-9 sm:px-2 md:min-h-9">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {suspend?<><circle cx="12" cy="12" r="9"/><path d="M6 18 18 6"/></>:<><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></>}
      </svg><span className="sr-only">{suspend?"Suspend Student":"Reactivate Student"}</span>
    </Button>
    {!open&&error?<Alert tone="error">{error}</Alert>:null}
    {success&&!open?<Alert tone="success">{success}</Alert>:null}
    <ConfirmDialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}
      title={suspend?"Suspend Student":"Reactivate Student"}
      description={suspend
        ? "Student: "+name+". Blocks access through this college membership immediately and revokes current sessions. This action is reversible; data and history are kept. Other active memberships are not ended. Provide a reason."
        : "Student: "+name+". Restores login access through this college membership, subject to platform sign-in restrictions. Other active memberships remain usable."}
      confirmLabel={suspend?"Confirm suspension":"Confirm reactivation"}
      confirmVariant={suspend?"danger":"primary"} pending={pending}
      confirmDisabled={suspend&&reason.trim().length<3}
      onConfirm={confirm}>
      <div className="min-w-0 space-y-[var(--lms-space-3)]">
        {suspend?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason
          <Input id={reasonId} className="min-h-11 w-full md:min-h-9" required minLength={3} maxLength={500}
            aria-describedby={reasonId+"-hint"} value={reason} disabled={pending} onChange={event=>setReason(event.target.value)}/>
          <span id={reasonId+"-hint"} className="text-xs font-normal text-muted-foreground">At least 3 characters, up to 500.</span>
        </label>:<p className="max-w-prose break-words text-sm leading-5 text-body">Restore access for this student membership?</p>}
        {error?<Alert tone="error">{error} {error.includes("Sign in again")?<Link href="/login" className="font-semibold underline">Sign in</Link>:null}</Alert>:null}
      </div>
    </ConfirmDialog>
  </div>;
}
