"use client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import {
  formatTpoBatchInviteSuccess,
  TPO_INVITATION_COPY,
} from "@/modules/placements/tpo-batch-invitation-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";

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
function confirmedRecipientCount(value:unknown):value is number {
 return typeof value==="number"&&Number.isSafeInteger(value)&&value>=0;
}
export function TpoBatchInvitationControl(props: Props) {
  const router = useRouter();
  const deadlineId=useId(),invitationId=useId();
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
    if (!date || date < props.minDate) { setError(!date ? TPO_INVITATION_COPY.pickDate : errors["DEADLINE_PASSED"] ?? "The registration deadline has to be in the future"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/placements/tpo/batches/" + encodeURIComponent(props.batchId) + "/invitation", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: date, expectedVersion: props.expectedVersion }),
      });
      const body:unknown = await response.json().catch(()=>null);
      const data=body&&typeof body==="object"?body as {error?:string;notifiedCount?:unknown}:null;
      if(!response.ok)
        throw new Error(response.status===409?"Batch changed. Refresh before inviting.":
          errors[data?.error??""]??"Could not invite this batch.");
      if(!confirmedRecipientCount(data?.notifiedCount))
        throw new Error("The invitation may have saved, but its recipient count could not be verified. Refresh the batch before retrying.");
      setMessage((data.notifiedCount===0 ? "Deadline set to " +
        (formatTpoBatchInviteSuccess(0, date).split("register by ")[1] ?? date) :
        formatTpoBatchInviteSuccess(data.notifiedCount, date)) +
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
      const data:unknown=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(response.status===409?
        "Registration changed or today’s reminder was already sent. Refresh to review the latest state.":
        "Could not send the reminder. Please try again.");
      const receipt=data&&typeof data==="object"?data as {reminded?:unknown;alreadySent?:unknown}:null;
      if(!confirmedRecipientCount(receipt?.reminded)||typeof receipt?.alreadySent!=="boolean")
       throw new Error("Reminder outcome could not be verified. Refresh the batch before trying again.");
      setMessage(receipt.alreadySent?"Already reminded today":
        receipt.reminded>0?"Reminded "+receipt.reminded+" student"+(receipt.reminded===1?"":"s")+" in the app":
        "Everyone has chosen already");
      setRemindReview(false);router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not send the reminder.")}
    finally{setBusy(false);}
  }
  if (props.invitedAt) {
    const deadlinePassed = props.deadlinePassed;
    const sameDeadline = date === (props.deadline?.slice(0,10) ?? "");
    return <section aria-label="Registration deadline" className="min-w-0 space-y-3 border-y border-border py-4">
      <Heading level={2} size="base" className="text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">{deadlinePassed ? "Registration closed" : "Registration is open"}</Heading>
      <Label htmlFor={deadlineId} className="block">Register by</Label>
      <Input className="min-h-11 w-full sm:max-w-xs md:min-h-9" id={deadlineId} aria-label="Registration deadline" type="date"
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
        <Label variant="choice" className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-[var(--lms-control-radius)] px-2 py-2 hover:bg-primary-subtle">
          <Checkbox checked={remindReview} disabled={busy}
            onChange={event=>setRemindReview(event.target.checked)}/>
          I reviewed the recipients. Send a reminder in the app; no SMS or email is claimed.
        </Label>
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
    <Heading level={2} size="base" className="text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">Invite {props.eligible} eligible {props.eligible === 1 ? "student" : "students"} to register</Heading>
    <Label className="block" htmlFor={invitationId}>{TPO_INVITATION_COPY.dateLabel}</Label>
    <Input className="min-h-11 w-full sm:max-w-xs md:min-h-9" id={invitationId} aria-label="Registration deadline" type="date" value={date} min={props.minDate}
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
