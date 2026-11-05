"use client";
import {Select} from "@/components/ui/select";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";

import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import { useRouter } from "next/navigation";
import {
  afterCollegeOptions,AFTER_COLLEGE_LABELS,MANUAL_AFTER_COLLEGE_OUTCOMES, type AfterCollegeOutcome,
} from "@/modules/placements/tpo-after-college-model";
import { Textarea } from "@/components/ui/textarea";

type AfterCollegeValue={outcome:AfterCollegeOutcome;outcomeLabel:string|null;outcomeDetail:string|null};
const equal=(a:AfterCollegeValue,b:AfterCollegeValue)=>
 a.outcome===b.outcome&&a.outcomeLabel===b.outcomeLabel&&a.outcomeDetail===b.outcomeDetail;
export function TpoAfterCollegeEditor({
 membershipId,learnerName,initial,available,labels,
}:{
 membershipId:string;learnerName:string;
 initial:AfterCollegeValue & {expectedVersion:string};
 available:boolean;labels:readonly {label:string;outcome:AfterCollegeOutcome}[];
}){
 const router=useRouter(),{run:runGuarded,pending}=useGuardedAction();
 const initialValue={outcome:initial.outcome,outcomeLabel:initial.outcomeLabel,outcomeDetail:initial.outcomeDetail};
 const [saved,setSaved]=useState<AfterCollegeValue>(initialValue);
 const [draft,setDraft]=useState<AfterCollegeValue>(initialValue);
 const [version,setVersion]=useState(initial.expectedVersion);
 const [confirmation,setConfirmation]=useState<{value:AfterCollegeValue;reversing:boolean}|null>(null);
 const [undo,setUndo]=useState<AfterCollegeValue|null>(null);
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const availableLabels=labels.filter(row=>row.outcome===draft.outcome);
 function write(value:AfterCollegeValue,reversing=false){
  if(!available||pending||(equal(value,saved)&&!reversing))return;
  setConfirmation({value,reversing});setError("");
 }
 async function apply(){
  if(!confirmation||pending)return;
  const {value,reversing}=confirmation;
  await runGuarded(async()=>{
   setMessage("");setError("");
   try{
    const data=await apiFetch<{version?:string}>(
     "/api/placements/tpo/students/"+encodeURIComponent(membershipId)+"/after-college",{
     method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify({...value,expectedVersion:version}),
    });
    const previous=saved;
    setSaved(value);setDraft(value);setVersion(data?.version??version);
    setUndo(reversing?null:previous);setConfirmation(null);
    setMessage(reversing?"Previous outcome restored.":"After-college outcome saved.");
    router.refresh();
   }catch(cause){
    setError(cause instanceof FriendlyFetchError && cause.status===409
     ?"This changed while you were working. Your outcome selection is kept below. Refresh before retrying."
     :cause instanceof Error?cause.message:"Could not save outcome. Please try again.");
   }
  });
 }
 return <div className="min-w-0 space-y-2" aria-label={"After college for "+learnerName}>
  <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold leading-4">
   After college
   <Select value={draft.outcome} disabled={!available||pending}
    onChange={event=>setDraft({outcome:event.target.value as AfterCollegeOutcome,outcomeLabel:null,outcomeDetail:null})}
    className="min-h-11 w-full min-w-0 md:min-h-9">
    {!MANUAL_AFTER_COLLEGE_OUTCOMES.includes(draft.outcome)?
     <option value={draft.outcome} disabled>{AFTER_COLLEGE_LABELS[draft.outcome]} · Automatic</option>:null}
    {afterCollegeOptions().map(option=><option value={option.value} key={option.value}>{option.label}</option>)}
   </Select>
  </label>
  {MANUAL_AFTER_COLLEGE_OUTCOMES.includes(draft.outcome)?<>
   <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold">
    College outcome label (optional)
    <Select value={draft.outcomeLabel??""} disabled={!available||pending}
     onChange={event=>setDraft({...draft,outcomeLabel:event.target.value||null})}
     className="min-h-11 w-full min-w-0 md:min-h-9">
     <option value="">No custom label</option>
     {draft.outcomeLabel&&!availableLabels.some(row=>row.label===draft.outcomeLabel)?
      <option value={draft.outcomeLabel} disabled>{draft.outcomeLabel} (no longer configured)</option>:null}
     {availableLabels.map(row=><option key={row.label} value={row.label}>{row.label}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold">
    Destination detail (optional, staff only)
    <Textarea value={draft.outcomeDetail??""} maxLength={200} rows={2}
     disabled={!available||pending} placeholder="Course, exam or destination details"
     onChange={event=>setDraft({...draft,outcomeDetail:event.target.value||null})}
     className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm text-foreground"/>
   </label>
   <p className="text-xs text-muted-foreground">Details are visible only in authorized placement-cell records.</p>
  </>:null}
  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
   <Button variant="primary" type="button" disabled={!available||pending||equal(draft,saved)}
    className="min-h-11 w-full md:min-h-9 sm:w-auto" onClick={()=>write(draft)}>Save</Button>
   {undo!==null&&!equal(undo,saved)?
    <Button variant="secondary" type="button" disabled={pending}
     className="min-h-11 w-full md:min-h-9 sm:w-auto" onClick={()=>write(undo,true)}>Undo</Button>:null}
  </div>
  {!available?<p className="text-xs text-muted-foreground">Outcome storage unavailable.</p>:null}
  {message?<InlineNotice tone="success" message={message}/>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
  <Dialog open={confirmation!==null} onOpenChange={open=>{if(!open&&!pending)setConfirmation(null);}}
   title={confirmation?.reversing?"Restore previous outcome":"Save after-college outcome"}
   description={(confirmation?.reversing?"Restore":"Save")+" after-college outcome for "+learnerName+"?"}
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button variant="secondary" disabled={pending} className="min-h-11 w-full md:min-h-9 sm:w-auto"
     onClick={()=>setConfirmation(null)}>Cancel</Button>
    <Button disabled={pending} loading={pending} className="min-h-11 w-full md:min-h-9 sm:w-auto"
     onClick={()=>void apply()}>{pending?"Saving…":"Confirm"}</Button></div>}>
   <p className="text-sm">Your selected outcome is kept if saving does not complete.</p>
  </Dialog>
 </div>;
}
