"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { getTpoDriveLifecycleReadiness } from "@/modules/placements/tpo-drive-lifecycle-service";
import { tpoDriveReadinessMessage } from "@/modules/placements/tpo-drive-lifecycle-model";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";

type Readiness = Awaited<ReturnType<typeof getTpoDriveLifecycleReadiness>>;
type Action = "PUBLISH" | "CLOSE" | "REOPEN";

export function TpoDriveLifecycleControls({ readiness, initialPublish = false }: { readiness: Readiness; initialPublish?: boolean }) {
  const router = useRouter();
  const {run}=useGuardedAction({timeoutMs:35000});
  const [action, setAction] = useState<Action | null>(initialPublish ? "PUBLISH" : null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [notifyByEmail,setNotifyByEmail]=useState(false);
  const [acknowledged,setAcknowledged]=useState(false);
  const [success,setSuccess]=useState("");
  const [error, setError] = useState<string | null>(null);
  const available = [
    { action: "PUBLISH" as const, decision: readiness.publish },

    { action: "REOPEN" as const, decision: readiness.reopen },
  ];
  const selected = available.find((item) => item.action === action) ?? null;

  async function submit() {
    if (!selected?.decision.allowed || reason.trim().length < 10 || pending || !acknowledged) return;
    await run(async()=>{
    setPending(true);
    setError(null);
    setSuccess("");
    try {
      const result = await apiFetch<{notifiedCount?:number;debarmentCounted?:number;emailSent?:boolean}>(
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
            notifyByEmail,
          }),
        },
      );

      setSuccess(selected.action==="PUBLISH"?
        "Published. "+(result.notifiedCount??0)+" eligible learners notified in the app. No email sent.":
        "Drive updated.");
      setAction(null);
      setReason("");
      setAcknowledged(false);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof FriendlyFetchError && failure.code==="EMAIL_DELIVERY_UNAVAILABLE"?
        "Email delivery is not configured. Choose app notifications only.":
        failure instanceof Error?failure.message:friendlyApiError({}));
    } finally {
      setPending(false);
    }
    });
  }

  return (
    <section id="drive-lifecycle-publish" className="border-b border-border pb-6">
      <h2 className="text-base font-semibold text-foreground">Drive publish / close / reopen</h2>
      <p className="mt-1 text-sm text-body">
        Current state: {readiness.status}. Publish and reopen require a persisted
        eligibility policy, an active role, an evaluative round and an active season/company.
        Reopen is blocked after applied results or accepted offers.
      </p>
      <div className="mt-4">
        {readiness.close.allowed ? (
          <Link href={"/tpo/placements/jobs/" + encodeURIComponent(readiness.jobId) + "/close-preview"}
            className="inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-primary-text">
            Review close consequences before confirming
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">
            Cannot close: {readiness.close.blockers.map(tpoDriveReadinessMessage).join(" ")}
          </p>
        )}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {available.map((item) => (
          <Button variant="secondary"
            key={item.action}
            type="button"
            onClick={() => { setAction(item.action); setError(null); setAcknowledged(false); }}
            disabled={pending || !item.decision.allowed}
            
          >
            {item.action} {item.decision.allowed ? "" : "(unavailable)"}
          </Button>
        ))}
      </div>
      {available.filter((item) => item.decision.blockers.length > 0).map((item) => (
        <p key={item.action} className="mt-2 text-xs text-muted-foreground">
          {item.action === "PUBLISH" ? "Before publishing" : "Before reopening"}: {item.decision.blockers.map(tpoDriveReadinessMessage).join(" ")}
        </p>
      ))}
      {selected?.decision.allowed ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-foreground">
            Reason for {selected.action.toLowerCase()} (required)
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={2}
              disabled={pending}
              className="mt-2 block w-full"
            />
          </label>
          {selected.action==="PUBLISH"?<div role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
            <p>{readiness.reach.eligible} students are eligible and will be told in the app.</p>
            <p>{readiness.reach.excluded} registered students are excluded or have turned off matching-job notices.</p>
            <p>Counts reflect a preview. Eligibility is checked again before publishing.</p>
          </div>:null}
          {selected.action==="PUBLISH"?<fieldset className="space-y-1 text-sm">
            <legend>Tell students</legend>
            <label className="flex gap-2"><input type="radio" name="publish-delivery"
              checked={!notifyByEmail} onChange={()=>setNotifyByEmail(false)}/>
              App only</label>
            <label className="flex gap-2 opacity-60"><input type="radio" name="publish-delivery"
              checked={false} disabled/>
              App and email (email delivery not configured)</label>
          </fieldset>:null}
          <label className="flex items-start gap-2 text-sm text-body">
            <input type="checkbox" checked={acknowledged}
              onChange={event=>setAcknowledged(event.target.checked)} disabled={pending}
              className="mt-1 h-4 w-4 accent-primary"/>
            I reviewed the learner visibility and drive state consequences. This decision is audited.
          </label>
          <div className="flex gap-3">
            <Button
              type="button"
              disabled={pending || reason.trim().length < 10 || !acknowledged}
              onClick={() => void submit()}
              
            >
              {pending ? "Saving..." : "Confirm " + selected.action.toLowerCase()}
            </Button>
            <Button variant="secondary"
              type="button"
              onClick={() => setAction(null)}
              disabled={pending}
              
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {success?<p role="status" className="mt-3 text-sm">{success}</p>:null}
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </section>
  );
}
