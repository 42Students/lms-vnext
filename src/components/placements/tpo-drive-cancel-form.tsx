"use client";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TpoDriveCancelImpact } from "@/modules/placements/tpo-drive-cancel-model";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";

const CANCEL_REASONS = [
  "Company withdrew",
  "Hiring freeze",
  "Moving it to a new date",
  "Not enough eligible students",
] as const;

type Preview = {
  id: string;
  expectedUpdatedAt: string;
  blockedByAcceptedOffers: boolean;
  impact: TpoDriveCancelImpact;
};

export function TpoDriveCancelForm({ preview }: { preview: Preview }) {
  const router = useRouter();
  const {run}=useGuardedAction({timeoutMs:35000});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reviewed,setReviewed]=useState(false);
  const rows = [
    ["Submitted applications (reviewed for closure)", preview.impact.submittedApplications],
    ["Open rounds that will be cancelled", preview.impact.openRounds],
    ["Issued offers that will be withdrawn", preview.impact.issuedOffers],
    ["Accepted offers (kept)", preview.impact.acceptedOffers],
  ] as const;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !reviewed) return;
    if (reason.trim().length < 10) {
      setError("Please explain the cancellation in at least 10 characters.");
      return;
    }
    await run(async()=>{
    setPending(true);
    setError(null);
    try {
      await apiFetch("/api/placements/tpo/jobs/" + encodeURIComponent(preview.id) + "/cancel-preview", {
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
      router.push("/tpo/placements/jobs/" + preview.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : friendlyApiError({}));
    } finally {
      setPending(false);
    }
    });
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4 border-b border-border pb-5">
      <h2 className="text-lg font-semibold text-foreground">Review consequences</h2>
      <p className="text-sm text-body">
        Cancelling stops new applications. Open applicants are marked Not selected and notified, pending or scheduled rounds are cancelled, and issued offers are withdrawn. Pending withdrawal requests are settled, the recruiter is notified when linked, and accepted offers remain valid. History is retained.
      </p>
      <dl className="grid grid-cols-1 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border sm:grid-cols-2">
        {rows.map(([label, n]) => (
          <div key={label} className="border-b border-border p-3 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
            <dt className="text-xs text-body">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-body">Reason for cancellation (audited)</p>
            <div className="flex flex-wrap gap-2" aria-label="Common cancellation reasons">
              {CANCEL_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={pending}
                  aria-pressed={reason === preset}
                  onClick={() => setReason(preset)}
                  className={`min-h-11 md:min-h-9 rounded-full border px-3 text-sm font-medium ${reason === preset
                    ? "border-primary bg-primary-subtle text-foreground"
                    : "border-border bg-surface text-body hover:border-primary"}`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <label className="block text-sm font-semibold text-body">
              Reason shown to students
              <textarea
                required
                name="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={10}
                maxLength={1000}
                rows={3}
                disabled={pending}
                className="mt-2 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-foreground"
              />
            </label>
            <p className="text-xs text-body">Students see the reason. You can choose a reason above or write your own.</p>
          </div>
          <p className="text-xs text-body">If the drive or counts change after this preview, the cancellation is rejected.</p>
          {error ? <p role="alert" className="text-sm text-foreground">{error}</p> : null}
          <label className="flex items-start gap-2 text-sm text-body">
            <input type="checkbox" checked={reviewed} onChange={event=>setReviewed(event.target.checked)}
              disabled={pending} className="mt-1 h-4 w-4 accent-primary"/>
            I reviewed the affected applications, rounds and offers. I understand cancellation
            will notify affected learners and cannot be silently undone.
          </label>
          <Button variant="primary" type="submit" disabled={pending || !reviewed} className="min-h-11 md:min-h-9 px-5">
            {pending ? "Cancelling…" : "Review and cancel drive"}
          </Button>
    </form>
  );
}
