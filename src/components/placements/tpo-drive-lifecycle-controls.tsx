"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { getTpoDriveLifecycleReadiness } from "@/modules/placements/tpo-drive-lifecycle-service";

type Readiness = Awaited<ReturnType<typeof getTpoDriveLifecycleReadiness>>;
type Action = "PUBLISH" | "CLOSE" | "REOPEN";

export function TpoDriveLifecycleControls({ readiness }: { readiness: Readiness }) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = [
    { action: "PUBLISH" as const, decision: readiness.publish },

    { action: "REOPEN" as const, decision: readiness.reopen },
  ];
  const selected = available.find((item) => item.action === action) ?? null;

  async function submit() {
    if (!selected?.decision.allowed || reason.trim().length < 10 || pending) return;
    if (!window.confirm(
      "Confirm " + selected.action.toLowerCase() + " for this drive? " +
      "This changes learner availability and is permanently audited.",
    )) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/placements/jobs/" + encodeURIComponent(readiness.jobId) + "/tpo-lifecycle",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            action: selected.action,
            expectedStatus: readiness.status,
            confirmed: true,
            reason: reason.trim(),
          }),
        },
      );
      if (!response.ok) throw new Error("Readiness or job state changed. Refresh before retrying.");
      setAction(null);
      setReason("");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Lifecycle action failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Drive publish / close / reopen</h2>
      <p className="mt-1 text-sm text-body">
        Current state: {readiness.status}. Publish and reopen require a persisted
        eligibility policy, an active role, an evaluative round and an active season/company.
        Reopen is blocked after applied results or accepted offers.
      </p>
      <div className="mt-4">
        {readiness.close.allowed ? (
          <Link href={"/tpo/placements/jobs/" + encodeURIComponent(readiness.jobId) + "/close-preview"}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-primary px-4 text-sm font-semibold text-primary-text">
            Review close consequences before confirming
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">
            CLOSE blockers: {readiness.close.blockers.join(", ")}
          </p>
        )}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {available.map((item) => (
          <button
            key={item.action}
            type="button"
            onClick={() => { setAction(item.action); setError(null); }}
            disabled={pending || !item.decision.allowed}
            className="min-h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {item.action} {item.decision.allowed ? "" : "(unavailable)"}
          </button>
        ))}
      </div>
      {available.filter((item) => item.decision.blockers.length > 0).map((item) => (
        <p key={item.action} className="mt-2 text-xs text-muted-foreground">
          {item.action} blockers: {item.decision.blockers.join(", ")}
        </p>
      ))}
      {selected?.decision.allowed ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-foreground">
            Reason for {selected.action.toLowerCase()} (required)
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={2}
              disabled={pending}
              className="mt-2 block w-full rounded-md border border-border bg-surface p-3 text-sm font-normal"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={pending || reason.trim().length < 10}
              onClick={() => void submit()}
              className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
            >
              {pending ? "Saving..." : "Confirm " + selected.action.toLowerCase()}
            </button>
            <button
              type="button"
              onClick={() => setAction(null)}
              disabled={pending}
              className="min-h-10 rounded-md border border-border px-4 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </section>
  );
}
