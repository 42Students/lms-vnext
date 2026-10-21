"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {InlineNotice} from "@/components/ui/inline-notice";

type Learner={membershipId:string;name:string;rollNumber:string|null};

/** College-scoped, explicit retake: never overwrite earlier learner attempts. */
export function CollegeCourseRetakeAction({learners,offeringId,deliveryId,courseName}:{
  learners:Learner[];offeringId:string;deliveryId:string;courseName:string;
}) {
  const router=useRouter(),locked=useRef(false);
  const [learnerMembershipId,setLearnerMembershipId]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const learner=learners.find(value=>value.membershipId===learnerMembershipId);
  async function start(){
    if(!learner||locked.current)return;
    if(!window.confirm("Start the next attempt for "+learner.name+" in "+courseName+
      "? The previous attempt will be kept as history."))return;
    locked.current=true;setBusy(true);setError("");setSuccess("");
    try{
      const response=await fetch("/api/college/course-progress/start-attempt",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({learnerMembershipId,offeringId,deliveryId}),
      });
      const result=await response.json().catch(()=>({})) as {
        error?:string;message?:string;attempt?:number;previousAttempt?:number;contentItemsReset?:number;alreadyFresh?:boolean;
      };
      if(!response.ok)throw new Error(result.message??result.error??"Could not start the next attempt.");
      setSuccess(result.alreadyFresh
        ?"This learner has no recorded progress for that course — they are already starting fresh."
        :result.attempt!==undefined
          ?"Attempt "+result.attempt+" started. "+
            (result.previousAttempt!==undefined?"Previous attempt "+result.previousAttempt:"The previous attempt")+
            " is kept as history."+
            (result.contentItemsReset!==undefined?" "+result.contentItemsReset+" content items reset.":"")
          :result.message??"Next attempt started. The previous attempt is kept as history.");
      router.refresh();
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Could not start the next attempt.");
    }finally{locked.current=false;setBusy(false);}
  }
  return <section className="min-w-0 space-y-3 border-b border-border pb-4 print:hidden"
    aria-label="Start next course attempt">
    <h2 className="font-semibold text-foreground">Start next attempt</h2>
    <p className="text-sm text-muted-foreground">
      Select a learner in the chosen Class and Course. Starting another attempt resets recorded content progress
      without deleting any previous attempt history.
    </p>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
        Learner
        <Select value={learnerMembershipId} disabled={busy}
          onChange={event=>{setLearnerMembershipId(event.target.value);setSuccess("");setError("");}}>
          <option value="">Select learner</option>
          {learners.map(item=><option key={item.membershipId} value={item.membershipId}>
            {item.name}{item.rollNumber?" · "+item.rollNumber:""}
          </option>)}
        </Select>
      </label>
      <Button type="button" variant="primary" disabled={!learner||busy} loading={busy}
        onClick={()=>void start()}>Start next attempt</Button>
    </div>
    {error?<InlineNotice tone="error" message={error}/>:null}
    {success?<div role="status"><InlineNotice tone="success" message={success}/></div>:null}
  </section>;
}
