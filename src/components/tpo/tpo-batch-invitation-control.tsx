"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  formatTpoBatchInviteSuccess,
  TPO_INVITATION_COPY,
} from "@/modules/placements/tpo-batch-invitation-model";

type Props = {
  batchId: string;
  invitedAt: string | null;
  finishedAt: string | null;
  deadline: string | null;
  expectedVersion: string;
  invitable: number;
  eligible: number;
  deadlinePassed: boolean;
  minDate: string;
};
const errors: Record<string, string> = {
  DEADLINE_REQUIRED: "Set the registration deadline",
  DEADLINE_PASSED: "The registration deadline has to be in the future",
  NO_ELIGIBLE_STUDENTS: "Nobody in this batch is eligible yet. Decide who is in placements first.",
  ELIGIBILITY_INCOMPLETE: "Review the student decisions before inviting.",
  EVERYONE_REGISTERED: "Everyone has chosen already",
  BATCH_ALREADY_INVITED: "Registration is open",
  BATCH_FINISHED: "This batch is finished. Reopen it first.",
};
export function TpoBatchInvitationControl(props: Props) {
  const router = useRouter();
  const [date, setDate] = useState(props.deadline?.slice(0, 10) ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [remindReview,setRemindReview]=useState(false);
  const ready = props.eligible > 0 &&
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
      const body = await response.json() as { error?: string; notifiedCount?: number };
      if (!response.ok)
        throw new Error(response.status === 409 ? "Batch changed. Refresh before inviting." :
          errors[body.error ?? ""] ?? "Could not invite this batch.");
      setMessage((body.notifiedCount === 0 ? "Deadline set to " +
        formatTpoBatchInviteSuccess(0, date).split("register by ")[1] :
        formatTpoBatchInviteSuccess(body.notifiedCount ?? props.invitable, date)) +
        ". In-app only; email delivery is not enabled.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not invite this batch.");
    } finally { setBusy(false); }
  }
  if (props.finishedAt) return <p>{TPO_INVITATION_COPY.markFinished}</p>;

  async function saveDeadline(clear: boolean) {
    setError(""); setMessage("");
    if (!clear && !date) { setError(TPO_INVITATION_COPY.pickDate); return; }
    if (clear && !window.confirm("Remove the registration deadline?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/placements/tpo/batches/" + props.batchId + "/invitation", {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline: clear ? null : date, expectedVersion: props.expectedVersion,
        }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok)
        throw new Error(response.status === 409 ? "Batch changed. Refresh before saving." :
          errors[body.error ?? ""] ?? "Could not save the deadline.");
      setMessage(clear ? "Deadline removed" : "Deadline moved");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the deadline.");
    } finally { setBusy(false); }
  }
  async function remind(){
    if(busy||!remindReview||!props.deadline)return;
    setBusy(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/placements/tpo/batches/"+encodeURIComponent(props.batchId)+"/remind",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({confirmed:true,expectedVersion:props.expectedVersion}),
      });
      const data=await response.json() as {reminded?:number;alreadySent?:boolean};
      if(!response.ok)throw new Error(response.status===409?
        "Registration changed or today’s reminder was already sent. Refresh to review the latest state.":
        "Could not send the reminder. Please try again.");
      setMessage(data.alreadySent?"Already reminded today":
        (data.reminded??0)>0?"Reminded "+data.reminded+" student"+(data.reminded===1?"":"s")+" in the app":
        "Everyone has chosen already");
      setRemindReview(false);router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not send the reminder.")}
    finally{setBusy(false);}
  }
  if (props.invitedAt) {
    const deadlinePassed = props.deadlinePassed;
    const sameDeadline = date === (props.deadline?.slice(0,10) ?? "");
    return <section aria-label="Registration deadline" className="space-y-3 rounded border border-border bg-surface p-4">
      <h2 className="font-semibold">{deadlinePassed ? "Registration closed" : "Registration is open"}</h2>
      <label htmlFor="batch-move-date" className="block text-sm">Register by</label>
      <input id="batch-move-date" aria-label="Registration deadline" type="date"
        value={date} min={props.minDate} onChange={event => setDate(event.target.value)}
        className="min-h-11 rounded border border-border bg-surface px-3"/>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !date || date < props.minDate || sameDeadline}
          onClick={() => void saveDeadline(false)}
          className="min-h-11 rounded border border-border px-4 disabled:opacity-50">
          {busy ? "Saving…" : deadlinePassed ? TPO_INVITATION_COPY.reopenAndTell : TPO_INVITATION_COPY.move}
        </button>
        <button type="button" disabled={busy || !props.deadline}
          onClick={() => void saveDeadline(true)}
          className="min-h-11 rounded border border-border px-4 disabled:opacity-50">
          {TPO_INVITATION_COPY.clear}
        </button>
      </div>
      {!deadlinePassed&&props.invitable>0?<fieldset id="batch-reminder" className="space-y-2 border-t border-border pt-3">
        <legend className="text-sm font-semibold">Remind eligible students</legend>
        <p className="text-sm">Eligible students of this batch who have not chosen Placements, Higher studies or Not interested get a reminder with the deadline.</p>
        <label className="flex items-start gap-2 text-sm text-body">
          <input type="checkbox" checked={remindReview} disabled={busy}
            onChange={event=>setRemindReview(event.target.checked)}/>
          I reviewed the recipients. Send a reminder in the app; no SMS or email is claimed.
        </label>
        <button type="button" disabled={busy||!remindReview}
          onClick={()=>void remind()}
          className="min-h-11 rounded border border-border px-4 text-sm disabled:opacity-50">
          {busy?"Sending…":"Send reminder"}
        </button>
      </fieldset>:null}
      {deadlinePassed ? <p className="text-sm text-muted-foreground">
        Move the deadline to reopen registration and tell eligible students in the app.
      </p> : null}
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </section>;
  }
  return <section className="space-y-3 rounded border border-border bg-surface p-4" aria-label="Invite batch">
    <h2 className="font-semibold">Invite {props.eligible} eligible {props.eligible === 1 ? "student" : "students"} to register</h2>
    <label className="block text-sm" htmlFor="batch-register-by">{TPO_INVITATION_COPY.dateLabel}</label>
    <input id="batch-register-by" aria-label="Registration deadline" type="date" value={date} min={props.minDate}
      onChange={event => setDate(event.target.value)}
      className="min-h-11 rounded border border-border bg-surface px-3" />
    <button type="button" onClick={() => void invite()}
      disabled={busy || !ready} className="min-h-11 rounded border border-border px-4 disabled:opacity-50">
      {busy ? "Inviting…" : TPO_INVITATION_COPY.invitation + " " + props.invitable}
    </button>
    {props.eligible === 0 ? <p className="text-sm">Nobody in this batch is eligible yet. Decide who is in placements first.</p> : null}
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
  </section>;
}
