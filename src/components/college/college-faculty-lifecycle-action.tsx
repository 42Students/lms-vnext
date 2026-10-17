"use client";

import { useState, useTransition } from "react";
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
  const [busy, start] = useTransition();
  if (status === "ENDED") return null;
  const action = status === "ACTIVE" ? "DEACTIVATE" : "REACTIVATE";
  function submit() {
    if (action === "DEACTIVATE" && reason.trim().length < 3) {
      setError("A reason of at least 3 characters is required.");
      return;
    }

    setError("");
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
        router.refresh();
      } catch (reasonError) {
        setError(reasonError instanceof Error ? reasonError.message : "Action failed");
      }
    });
  }
  return <div className="mt-2">
    <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
      className="mr-2 inline-flex min-h-10 items-center text-xs font-semibold text-primary-text hover:underline">Audit history</Link>
    <button type="button" onClick={() => setEditing(value => !value)} disabled={busy}
      className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-primary-text">
      {action === "DEACTIVATE" ? "Suspend Faculty" : "Reactivate Faculty"}
    </button>
    {editing ? <div className="mt-2 space-y-2 rounded-md border border-border bg-surface p-3">
      <p className="text-xs font-semibold">{facultyLifecycleConfirmation(name,action)}</p>
      {action === "DEACTIVATE" ? <label className="block text-xs text-body">
        Reason
        <input maxLength={500} value={reason} onChange={e => setReason(e.target.value)}
          className="mt-1 w-full rounded-md border border-border p-2 text-foreground" />
      </label> : <p className="text-xs text-body">Restore access for this faculty membership?</p>}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      <button type="button" onClick={submit} disabled={busy}
        className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-on-primary">Confirm {action === "DEACTIVATE" ? "suspension" : "reactivation"}</button>
      <button type="button" onClick={() => setEditing(false)}
        className="ml-2 rounded-md border border-border px-3 py-2 text-xs">Cancel</button>
    </div> : null}
  </div>;
}
