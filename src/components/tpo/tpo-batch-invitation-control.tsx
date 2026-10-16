"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TPO_INVITATION_COPY } from "@/modules/placements/tpo-batch-invitation-model";

type Props = {
  batchId: string;
  invitedAt: string | null;
  finishedAt: string | null;
  deadline: string | null;
  expectedVersion: string;
  eligible: number;
  complete: boolean;
  unrecorded: number;
};
const errors: Record<string, string> = {
  DEADLINE_REQUIRED: "Pick the date first",
  DEADLINE_PASSED: "The registration deadline must be in the future.",
  NO_ELIGIBLE_STUDENTS: "No eligible students to invite.",
  ELIGIBILITY_INCOMPLETE: "Review the student decisions before inviting.",
  EVERYONE_REGISTERED: "Everyone has chosen already",
  BATCH_ALREADY_INVITED: "This batch is already invited.",
  BATCH_FINISHED: "This batch is finished",
};
export function TpoBatchInvitationControl(props: Props) {
  const router = useRouter();
  const [date, setDate] = useState(props.deadline?.slice(0, 10) ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const ready = props.complete && props.eligible > 0 && props.unrecorded > 0 &&
    !props.invitedAt && !props.finishedAt;
  async function invite() {
    setError(""); setMessage("");
    if (!date) { setError(TPO_INVITATION_COPY.pickDate); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/placements/tpo/batches/" + props.batchId + "/invitation", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: date, expectedVersion: props.expectedVersion }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok)
        throw new Error(response.status === 409 ? "Batch changed. Refresh before inviting." :
          errors[body.error ?? ""] ?? "Could not invite this batch.");
      setMessage("Registration is open. Outbound invitation delivery has not been sent.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not invite this batch.");
    } finally { setBusy(false); }
  }
  if (props.finishedAt) return <p>{TPO_INVITATION_COPY.markFinished}</p>;
  if (props.invitedAt) return <p>Registration invitation recorded. Students can register while the deadline is open.</p>;
  return <section className="space-y-3 rounded border border-border bg-surface p-4" aria-label="Invite batch">
    <h2 className="font-semibold">Invite {props.eligible} eligible {props.eligible === 1 ? "student" : "students"} to register</h2>
    <label className="block text-sm" htmlFor="batch-register-by">{TPO_INVITATION_COPY.dateLabel}</label>
    <input id="batch-register-by" aria-label="Registration deadline" type="date" value={date}
      onChange={event => setDate(event.target.value)}
      className="min-h-11 rounded border border-border bg-surface px-3" />
    <button type="button" onClick={() => void invite()}
      disabled={busy || !ready} className="min-h-11 rounded border border-border px-4 disabled:opacity-50">
      {busy ? "Inviting…" : TPO_INVITATION_COPY.invitation}
    </button>
    {!props.complete ? <p className="text-sm text-muted-foreground">Review the student decisions before inviting.</p> : null}
    {props.eligible === 0 ? <p className="text-sm">No eligible students to invite.</p> : null}
    {props.unrecorded === 0 ? <p className="text-sm">Everyone has chosen already</p> : null}
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
  </section>;
}
