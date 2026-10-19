"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  return <div className="mt-2 space-y-2">
    <Button variant="secondary" type="button" disabled={pending} onClick={() => setOpen(value => !value)}
      className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-xs font-semibold text-primary-text">
      {suspend ? "Suspend" : "Reactivate"}
    </Button>
    {open && <div className="space-y-2 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-3">
      <p className="text-xs font-semibold">{suspend?"Suspend ":"Reactivate "}{name}?</p>
      {suspend && <label className="grid gap-1 text-xs">Reason
        <Input maxLength={500} value={reason} onChange={event => setReason(event.target.value)}
          className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-2" />
      </label>}
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
      <Button variant="primary" type="button" disabled={pending} onClick={confirm}
        className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] bg-primary px-3 text-xs font-semibold text-on-primary">
        Confirm {suspend ? "suspension" : "reactivation"}
      </Button>
      <Button variant="secondary" type="button" disabled={pending} onClick={() => setOpen(false)}
        className="ml-2 min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-2 text-xs">Cancel</Button>
    </div>}
  </div>;
}
