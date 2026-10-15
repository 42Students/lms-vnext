"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TpoDriveCancelImpact } from "@/modules/placements/tpo-drive-cancel-model";

type Preview = {
  id: string;
  expectedUpdatedAt: string;
  blockedByAcceptedOffers: boolean;
  impact: TpoDriveCancelImpact;
};

export function TpoDriveCancelForm({ preview }: { preview: Preview }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = [
    ["Submitted applications (retained)", preview.impact.submittedApplications],
    ["Open rounds that will be cancelled", preview.impact.openRounds],
    ["Issued offers (retained, not withdrawn)", preview.impact.issuedOffers],
    ["Accepted offers (block cancellation)", preview.impact.acceptedOffers],
  ] as const;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    if (!window.confirm("Cancel this drive? It will be closed and its open rounds cancelled. This is audited and cannot be undone here.")) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/placements/tpo/jobs/" + preview.id + "/cancel-preview", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          confirmed: true,
          expectedUpdatedAt: preview.expectedUpdatedAt,
          expectedImpact: preview.impact,
          reason,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          body?.error === "PLACEMENT_JOB_CANCEL_BLOCKED"
            ? "Accepted offers exist, so this drive cannot be cancelled."
            : "The preview is stale or the drive changed. Refresh and review again.",
        );
      }
      router.push("/tpo/placements/jobs/" + preview.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">Review consequences</h2>
      <p className="text-sm text-body">
        Cancelling closes the drive to new applications and cancels every pending or scheduled round. Applications and offers are never deleted.
      </p>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map(([label, n]) => (
          <div key={label} className="rounded-lg border border-border bg-surface-subtle p-3">
            <dt className="text-xs text-body">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
      {preview.blockedByAcceptedOffers ? (
        <p role="status" className="text-sm text-error">
          Accepted offers exist. Resolve them before cancelling this drive.
        </p>
      ) : (
        <>
          <label className="block text-sm font-semibold text-body">
            Reason for cancellation (audited)
            <textarea required name="reason" minLength={10} maxLength={1000} rows={3} className="mt-2 w-full rounded-md border border-border bg-surface p-3 text-foreground" />
          </label>
          <p className="text-xs text-body">If the drive or counts change after this preview, the cancellation is rejected.</p>
          {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
          <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">
            {pending ? "Cancelling…" : "Review and cancel drive"}
          </button>
        </>
      )}
    </form>
  );
}
