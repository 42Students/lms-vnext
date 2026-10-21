"use client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
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
  const [confirmClear,setConfirmClear]=useState(false);
  const ready = props.eligible > 0 &&
    !props.invitedAt && !props.finishedAt;
  async function invite() {
    if(busy)return;
    setError(""); setMessage("");
    if (!date || date < props.minDate) { setError(!date ? TPO_INVITATION_COPY.pickDate : errors.DEADLINE_PASSED); return; }
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
  if (props.finishedAt) return <p role="status" className="border-y border-border py-4 text-sm text-body leading-[22px]">{TPO_INVITATION_COPY.markFinished}</p>;

  async function saveDeadline(clear: boolean) {
    if(busy)return;
    setError(""); setMessage("");
    if (!clear && !date) { setError(TPO_INVITATION_COPY.pickDate); return; }
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
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the deadline.");
      return false;
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
    return <section aria-label="Registration deadline" className="min-w-0 space-y-3 border-y border-border py-4">
      <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">{deadlinePassed ? "Registration closed" : "Registration is open"}</h2>
      <label htmlFor="batch-move-date" className="block text-sm font-semibold text-body">Register by</label>
      <Input className="min-h-11 w-full sm:max-w-xs md:min-h-9" id="batch-move-date" aria-label="Registration deadline" type="date"
        value={date} min={props.minDate} onChange={event => setDate(event.target.value)}
        />
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button variant="primary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy || !date || date < props.minDate || sameDeadline}
          onClick={() => void saveDeadline(false)}
          >
          {busy ? "Saving…" : deadlinePassed ? TPO_INVITATION_COPY.reopenAndTell : TPO_INVITATION_COPY.move}
        </Button>
        <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy || !props.deadline}
          onClick={() => setConfirmClear(true)}
          >
          {TPO_INVITATION_COPY.clear}
        </Button>
      </div>
      {!deadlinePassed&&props.invitable>0?<fieldset id="batch-reminder" className="space-y-2 border-t border-border pt-3">
        <legend className="text-sm font-semibold">Remind eligible students</legend>
        <p className="text-sm leading-[22px]">Eligible students of this batch who have not chosen Placements, Higher studies or Not interested get a reminder with the deadline.</p>
        <label className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-[var(--lms-control-radius)] px-2 py-2 text-sm leading-6 text-body hover:bg-primary-subtle">
          <Checkbox checked={remindReview} disabled={busy}
            onChange={event=>setRemindReview(event.target.checked)}/>
          I reviewed the recipients. Send a reminder in the app; no SMS or email is claimed.
        </label>
        <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy||!remindReview}
          onClick={()=>void remind()}
          >
          {busy?"Sending…":"Send reminder"}
        </Button>
      </fieldset>:null}
      {deadlinePassed ? <p className="text-sm text-muted-foreground leading-[22px]">
        Move the deadline to reopen registration and tell eligible students in the app.
      </p> : null}
      {message ? <InlineNotice tone="success" message={message} onDismiss={() => setMessage("")} /> : null}
      {error ? <InlineNotice tone="error" message={error} onDismiss={() => setError("")} /> : null}
      <ConfirmDialog open={confirmClear} onOpenChange={next=>{if(!busy)setConfirmClear(next);}}
       title="Remove the registration deadline?" description="Registration stays open without a deadline until another is set." confirmLabel="Remove" pending={busy} confirmVariant="danger"
       onConfirm={()=>{void saveDeadline(true).then(saved=>{if(saved)setConfirmClear(false);});}}/>
    </section>;
  }
  return <section className="min-w-0 space-y-3 border-y border-border py-4" aria-label="Invite batch">
    <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Invite {props.eligible} eligible {props.eligible === 1 ? "student" : "students"} to register</h2>
    <label className="block text-sm font-semibold text-body" htmlFor="batch-register-by">{TPO_INVITATION_COPY.dateLabel}</label>
    <Input className="min-h-11 w-full sm:max-w-xs md:min-h-9" id="batch-register-by" aria-label="Registration deadline" type="date" value={date} min={props.minDate}
      onChange={event => setDate(event.target.value)}
       />
    <Button variant="primary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={() => void invite()}
      disabled={busy || !ready || !date || date < props.minDate} >
      {busy ? "Inviting…" : TPO_INVITATION_COPY.invitation + " " + props.invitable}
    </Button>
    {props.eligible === 0 ? <p className="text-sm leading-[22px]">Nobody in this batch is eligible yet. Decide who is in placements first.</p> : null}
    {message ? <InlineNotice tone="success" message={message} onDismiss={() => setMessage("")} /> : null}
    {error ? <InlineNotice tone="error" message={error} onDismiss={() => setError("")} /> : null}
  </section>;
}
