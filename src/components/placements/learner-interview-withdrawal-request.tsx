"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {learnerInterviewWithdrawalInputSchema,type LearnerInterviewWithdrawalTarget} from "@/modules/placements/learner-interview-withdrawal-model";
import {Textarea} from "@/components/ui/textarea";
export function LearnerInterviewWithdrawalRequest({target}:{target:LearnerInterviewWithdrawalTarget}){
  const router=useRouter();
  const [review,setReview]=useState(false),[reason,setReason]=useState("");
  const [pending,setPending]=useState(false),[submitted,setSubmitted]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function submit(){
    if(pending)return;
    // Construct the boundary explicitly: display-only pending is not accepted.
    const input=learnerInterviewWithdrawalInputSchema.safeParse({
      applicationId:target.applicationId,roundId:target.roundId,expectedUpdatedAt:target.expectedUpdatedAt,reason,confirmed:true,
    });
    if(!input.success){setError(input.error.issues[0]?.message??"Enter a reason.");return;}
    setPending(true);setError(null);
    try{
      const response=await fetch("/api/placements/interviews/withdrawal-request",{
        method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input.data),
      });
      const result=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(result?.error==="PLACEMENT_REQUEST_STALE"
        ? "Your application changed. Close this panel and reload interviews before trying again."
        : "Your request was not recorded. Reload interviews or try again.");
      setSubmitted(true);setReview(false);router.refresh();
    }catch(err){setError(err instanceof Error?err.message:"Unable to record request.");}
    finally{setPending(false);}
  }
  return <section className="space-y-3 border-t border-border pt-4" aria-labelledby="learner-interview-withdrawal-title">
    <h3 id="learner-interview-withdrawal-title" className="text-sm font-semibold text-[var(--lms-heading)]">Ask the placement team to withdraw</h3>
    <p className="text-sm leading-[22px] text-body">This requests withdrawal of the whole application, including its interview rounds. Your application and interview remain active until the placement team approves.</p>
    {target.pending||submitted ? <p role="status" className="text-sm text-body leading-[22px]">
      Withdrawal requested; awaiting the placement team&apos;s decision. <Link className="font-semibold text-primary-text underline focus-visible:underline" href="/learn/my-placements/support?status=PENDING&type=APPLICATION_WITHDRAWAL">Review request</Link>
    </p> : review ? <div className="space-y-3">
      <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">Reason for requesting withdrawal
        <Textarea value={reason} maxLength={2000} minLength={3} required rows={3} disabled={pending} aria-invalid={Boolean(error)} aria-describedby={error?"learner-interview-withdrawal-error":undefined} onChange={event=>setReason(event.target.value)}
          className="mt-2 w-full" />
      </label>
      {error?<p role="alert" id="learner-interview-withdrawal-error" className="text-sm text-error leading-[22px]">{error}</p>:null}
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11 md:min-h-9 w-full md:w-auto" disabled={pending||reason.trim().length<3} onClick={()=>void submit()}>{pending?"Submitting…":"Confirm withdrawal request"}</Button>
        <Button className="min-h-11 md:min-h-9 w-full md:w-auto" variant="secondary" disabled={pending} onClick={()=>{setReview(false);setError(null);}}>Keep application active</Button>
      </div>
    </div> : <Button className="min-h-11 md:min-h-9 w-full md:w-auto" variant="secondary" onClick={()=>setReview(true)}>Review withdrawal request</Button>}
  </section>;
}
