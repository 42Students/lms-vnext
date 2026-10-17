"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CollegeStudentLifecycleAction({ membershipId, name, status }: {
  membershipId: string; name: string; status: "ACTIVE" | "SUSPENDED" | "ENDED";
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (status === "ENDED") return null;
  const suspend = status === "ACTIVE";
  function confirm() {
    if (suspend && reason.trim().length < 3) {
      setError("Suspension reason must be at least 3 characters."); return;
    }

    start(async () => {
      try {
        const response = await fetch("/api/people/" + encodeURIComponent(membershipId) + "/lifecycle", {
          method: "PATCH", headers: { "content-type": "application/json" },
          body: JSON.stringify(suspend ? { action: "SUSPEND", reason: reason.trim() }
            : { action: "REACTIVATE" }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw Error(data?.error ?? "Action refused");
        setOpen(false); setReason(""); setError(""); router.refresh();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Action refused"); }
    });
  }
  return <div className="mt-2 space-y-2">
    <button type="button" disabled={pending} onClick={() => setOpen(value => !value)}
      className="min-h-9 rounded border border-border px-3 text-xs font-semibold text-primary-text">
      {suspend ? "Suspend" : "Reactivate"}
    </button>
    {open && <div className="space-y-2 rounded border border-border bg-surface p-3">
      <p className="text-xs font-semibold">{suspend?"Suspend ":"Reactivate "}{name}?</p>
      {suspend && <label className="grid gap-1 text-xs">Reason
        <input maxLength={500} value={reason} onChange={event => setReason(event.target.value)}
          className="min-h-9 rounded border border-border px-2" />
      </label>}
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
      <button type="button" disabled={pending} onClick={confirm}
        className="min-h-9 rounded bg-primary px-3 text-xs font-semibold text-on-primary">
        Confirm {suspend ? "suspension" : "reactivation"}
      </button>
      <button type="button" disabled={pending} onClick={() => setOpen(false)}
        className="ml-2 min-h-9 rounded border border-border px-2 text-xs">Cancel</button>
    </div>}
  </div>;
}
