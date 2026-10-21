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
import { Alert } from "@/components/ui/alert";
import { InlineNotice } from "@/components/ui/inline-notice";
import {Textarea} from "@/components/ui/textarea";
import {Dialog} from "@/components/ui/dialog";
import {Select} from "@/components/ui/select";

type Readiness = Awaited<ReturnType<typeof getTpoDriveLifecycleReadiness>>;
type Action = "PUBLISH" | "CLOSE" | "REOPEN";
const DECLINE_REQUEST_REASONS=[
 "Does not fit our students",
 "Details are incomplete",
 "Clashes with another drive",
 "Company is not approved",
] as const;

export function TpoDriveLifecycleControls({ readiness, initialPublish = false, requestId,requestStatus }: {
 readiness: Readiness; initialPublish?: boolean;requestId?:string;
 requestStatus?:"REQUEST"|"SENT_BACK"|null;
}) {
  const router = useRouter();
  const {run}=useGuardedAction({timeoutMs:35000});
  const [action, setAction] = useState<Action | null>(initialPublish ? "PUBLISH" : null);
  const [reason, setReason] = useState("");
  const [declineOpen,setDeclineOpen]=useState(false);
  const [declineReason,setDeclineReason]=useState("");
  const canDecline=Boolean(requestId&&(requestStatus==="REQUEST"||requestStatus==="SENT_BACK"));
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

      setSuccess(selected.action==="PUBLISH"?"Published":"Reopened");
      // The legacy app+email default is NOT delivered by this adapter;
      // keep any notification counts separate from the success claim.
      if(selected.action==="PUBLISH"&&result.emailSent===true)
        setSuccess("Published");
      setAction(null);
      setReason("");
      setAcknowledged(false);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof FriendlyFetchError && failure.code==="EMAIL_DELIVERY_UNAVAILABLE"?
        "Email delivery is not configured. Choose app notifications only.":
        failure instanceof Error?failure.message:
          selected.action==="PUBLISH"?"Publish failed":"Reopen failed");
    } finally {
      setPending(false);
    }
    });
  }

  async function declineRecruiterRequest(){
    if(!canDecline||!requestId||!requestStatus||
       !DECLINE_REQUEST_REASONS.includes(declineReason as typeof DECLINE_REQUEST_REASONS[number])||
       pending)return;
    await run(async()=>{
      setPending(true);setError(null);setSuccess("");
      try{
        await apiFetch("/api/placements/tpo/drive-requests/"+
          encodeURIComponent(requestId)+"/decision",{
          method:"POST",credentials:"same-origin",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({action:"DECLINE",expectedStatus:requestStatus,
            reason:declineReason,confirmed:true}),
        });
        setSuccess("Declined");
        setDeclineOpen(false);setDeclineReason("");
        router.refresh();
      }catch(cause){
        setError(cause instanceof Error?cause.message:"Decline failed");
      }finally{setPending(false);}
    });
  }

  return (
    <section id="drive-lifecycle-publish" className="border-b border-border pb-6">
      <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Drive publish / close / reopen</h2>
      <p className="mt-1 text-sm text-body leading-[22px]">
        Current state: {readiness.status}. Publish and reopen require a persisted
        eligibility policy, an active role, an evaluative round and an active season/company.
        Reopen is blocked after applied results or accepted offers.
      </p>
      {canDecline ? <div className="mt-3">
        <Button type="button" variant="danger" disabled={pending}
          onClick={()=>{setDeclineReason("");setDeclineOpen(true);setError(null);}}>
          Decline this request
        </Button>
      </div> : null}
      <div className="mt-4">
        {readiness.close.allowed ? (
          <Link href={"/tpo/placements/jobs/" + encodeURIComponent(readiness.jobId) + "/close-preview"}
            className="inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-[650] text-primary-text">
            Review close consequences before confirming
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground leading-[20px]">
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
        <p key={item.action} className="mt-2 text-xs text-muted-foreground leading-[20px]">
          {item.action === "PUBLISH" ? "Before publishing" : "Before reopening"}: {item.decision.blockers.map(tpoDriveReadinessMessage).join(" ")}
        </p>
      ))}
      {!readiness.publish.allowed&&readiness.publish.blockers.length===0 ?
        <p role="alert" className="mt-3 text-sm text-error">Could not verify eligibility and rounds. Retry before publishing.</p> : null}
      {selected?.decision.allowed ? (
        <div className="mt-4 space-y-3">
          <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
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
          {selected.action==="PUBLISH"?<Alert tone="info">
            <p>{readiness.reach.eligible} students are eligible and will be told in the app.</p>
            <p>{readiness.reach.excluded} registered students are excluded or have turned off matching-job notices.</p>
            <p>Counts reflect a preview. Eligibility is checked again before publishing.</p>
          </Alert>:null}
          {selected.action==="PUBLISH"?<fieldset className="space-y-1 text-sm">
            <legend>Tell students</legend>
            <label className="flex gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"><input type="radio" name="publish-delivery"
              checked={!notifyByEmail} onChange={()=>setNotifyByEmail(false)}/>
              App only</label>
            <label className="flex gap-2 opacity-60 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"><input type="radio" name="publish-delivery"
              checked={false} disabled/>
              App and email (email delivery not configured)</label>
          </fieldset>:null}
          <label className="flex items-start gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
      <Dialog open={declineOpen} title="Decline this request"
        description="The recruiter sees this reason. For anything they can fix, request a change instead: the drive stays in review."
        onOpenChange={open=>{if(!open&&!pending)setDeclineOpen(false);}}
        footer={<div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={pending}
            onClick={()=>setDeclineOpen(false)}>Cancel</Button>
          <Button type="button" variant="danger"
            disabled={pending || !DECLINE_REQUEST_REASONS.includes(
              declineReason as typeof DECLINE_REQUEST_REASONS[number])}
            onClick={()=>void declineRecruiterRequest()}>
            {pending?"Declining…":"Decline"}
          </Button>
        </div>}>
        <label className="block text-sm font-semibold text-foreground">
          Reason
          <Select className="mt-2 w-full" value={declineReason}
            onChange={event=>setDeclineReason(event.target.value)}>
            <option value="">Tell them why</option>
            {DECLINE_REQUEST_REASONS.map(value=><option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
      </Dialog>
      {success?<InlineNotice tone="success" message={success}/>:null}
      {error ? <InlineNotice tone="error" message={error}/> : null}
    </section>
  );
}
