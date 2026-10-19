"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  return <div className="mt-2">
    <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
      className="mr-2 inline-flex min-h-11 items-center text-xs font-semibold text-primary-text hover:underline">Audit history</Link>
    <Button variant="secondary" type="button" onClick={() => setEditing(value => !value)} disabled={busy}
      className="rounded-[var(--lms-control-radius,9px)] border border-border px-3 py-2 text-xs font-semibold text-primary-text">
      {action === "DEACTIVATE" ? "Suspend Faculty" : "Reactivate Faculty"}
    </Button>
    {success?<p role="status" className="mt-2 text-xs text-body">{success}</p>:null}
    {editing ? <div className="mt-2 space-y-2 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-3">
      <p className="text-xs font-semibold">{facultyLifecycleConfirmation(name,action)}</p>
      {action === "DEACTIVATE" ? <label className="block text-xs text-body">
        Reason
        <Input maxLength={500} value={reason} onChange={e => setReason(e.target.value)}
          className="mt-1 w-full rounded-[var(--lms-control-radius,9px)] border border-border p-2 text-foreground text-base sm:text-sm" />
      </label> : <p className="text-xs text-body">Restore access for this faculty membership?</p>}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      <Button variant="primary" type="button" onClick={submit} disabled={busy}
        className="rounded-[var(--lms-control-radius,9px)] bg-primary px-3 py-2 text-xs font-semibold text-on-primary">Confirm {action === "DEACTIVATE" ? "suspension" : "reactivation"}</Button>
      <Button variant="secondary" type="button" onClick={() => setEditing(false)}
        className="ml-2 rounded-[var(--lms-control-radius,9px)] border border-border px-3 py-2 text-xs">Cancel</Button>
    </div> : null}
  </div>;
}
