"use client";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import { FilterChip } from "@/components/ui/filter-chip";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TpoDriveCancelImpact } from "@/modules/placements/tpo-drive-cancel-model";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";

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
    <form onSubmit={(e) => void submit(e)} className="min-w-0 space-y-4 border-b border-border pb-6">
      <Heading level={2} size="base" className="text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">Review consequences</Heading>
      <p className="max-w-prose text-sm text-body leading-[22px]">
        Cancelling stops new applications. Open applicants are marked Not selected and notified, pending or scheduled rounds are cancelled, and issued offers are withdrawn. Pending withdrawal requests are settled, the recruiter is notified when linked, and accepted offers remain valid. History is retained.
      </p>
      <dl className="grid min-w-0 grid-cols-1 gap-x-6 border-t border-border md:grid-cols-4">
        {rows.map(([label, n]) => (
          <div key={label} className="min-w-0 border-b border-border px-1 py-4">
            <dt className="text-xs text-body">{label}</dt>
            <dd className="break-words text-2xl font-semibold tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
          <div className="min-w-0 space-y-3">
            <p className="text-sm font-semibold text-body leading-[22px]">Reason for cancellation (audited)</p>
            <div className="flex min-w-0 flex-wrap gap-2" aria-label="Common cancellation reasons">
              {CANCEL_REASONS.map((preset) => (
                <FilterChip
                  key={preset}
                  type="button"
                  disabled={pending}
                  aria-pressed={reason === preset}
                  onClick={() => setReason(preset)}
                >
                  {preset}
                </FilterChip>
              ))}
            </div>
            <Label stack className="min-w-0">
              Reason shown to students
              <Textarea
                required
                name="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={10}
                maxLength={1000}
                rows={3}
                disabled={pending}
                className="min-h-11 w-full md:min-h-9"
              />
            </Label>
            <p className="text-xs text-body leading-[20px]">Students see the reason. You can choose a reason above or write your own.</p>
          </div>
          <p className="text-xs text-body leading-[20px]">If the drive or counts change after this preview, the cancellation is rejected.</p>
          {error ? <InlineNotice tone="error" role="alert" message={error}/> : null}
          <Label className="flex items-start gap-[6px]">
            <Checkbox checked={reviewed} onChange={event=>setReviewed(event.target.checked)}
              disabled={pending} className="mt-1 h-4 w-4 accent-primary"/>
            I reviewed the affected applications, rounds and offers. I understand cancellation
            will notify affected learners and cannot be silently undone.
          </Label>
          <Button variant="primary" type="submit" disabled={pending || !reviewed} className="min-h-11 w-full px-5 md:min-h-9 md:w-auto">
            {pending ? "Cancelling…" : "Review and cancel drive"}
          </Button>
    </form>
  );
}
