"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Select} from "@/components/ui/select";

type InterviewRound={id:string;name:string;sequence:number};
type DraftInterviewSlot={
 roundId:string;mode:string;startAt:string;endAt:string;capacity:string;
 panelLabel:string;meetingLocation:string;
};
/** Times are the form's declared India Standard Time, not browser-local time. */
function nowInIst(){
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date()).replace(" ","T");
}
export function RecruiterInterviewSlotForm({action,rounds}:{action:string;rounds:readonly InterviewRound[]}){
 const router=useRouter();
 const submitLock=useRef(false);
 const [submitting,setSubmitting]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const [dirty,setDirty]=useState(false);
 const [start,setStart]=useState("");
 const [end,setEnd]=useState("");
 const [error,setError]=useState<string|null>(null);
 const [queued,setQueued]=useState<DraftInterviewSlot[]>([]);
 const today=nowInIst();
 useEffect(()=>{
  if(!dirty||submitting)return;
  const onExit=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",onExit);
  return ()=>window.removeEventListener("beforeunload",onExit);
 },[dirty,submitting]);
 function readSlot(form:HTMLFormElement):DraftInterviewSlot|null{
  const data=new FormData(form);
  const field=(name:string)=>String(data.get(name)??"").trim();
  const slot:DraftInterviewSlot={
   roundId:field("roundId"),mode:field("mode"),
   startAt:start,endAt:end,capacity:field("capacity"),
   panelLabel:field("panelLabel"),meetingLocation:field("meetingLocation"),
  };
  const now=nowInIst();
  if(!rounds.some(row=>row.id===slot.roundId)){
   setError("Select an interview round.");return null;
  }
  if(!slot.startAt||!slot.endAt){
   setError("Select both interview start and end times.");return null;
  }
  if(slot.startAt<now){
   setError("Interview time must be in the future (IST).");return null;
  }
  if(slot.endAt<=slot.startAt){
   setError("End time must be after start time.");return null;
  }
  const capacity=Number(slot.capacity);
  if(!Number.isInteger(capacity)||capacity<1||capacity>100){
   setError("Capacity must be between 1 and 100.");return null;
  }
  return slot;
 }
 function queueSlot(form:HTMLFormElement){
  if(submitting||queued.length>=9)return;
  const slot=readSlot(form);
  if(!slot)return;
  setQueued(current=>[...current,slot]);
  setNotice("Time block added to the proposal. Propose all time blocks to save them.");
  setError(null);setStart("");setEnd("");setDirty(true);
  form.reset();
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(submitLock.current)return;
  const form=event.currentTarget;
  // Each legacy entry can carry a different round, mode, panel and capacity.
  // The native API only writes one block transactionally. Present and retain
  // any partial success instead of claiming a nonexistent atomic batch.
  const hasCurrent=Boolean(start||end);
  // After a partial failure the remaining queue can be retried unchanged,
  // without inventing a new final time block just to submit it.
  const current=hasCurrent||queued.length===0?readSlot(form):null;
  if((hasCurrent||queued.length===0)&&!current)return;
  const entries=current?[...queued,current]:[...queued];
  if(entries.length>10){setError("Propose at most 10 time blocks at once.");return;}
  const now=nowInIst();
  if(entries.some(slot=>slot.startAt<now||slot.endAt<=slot.startAt)){
   setError("Review queued time blocks. Start and end times must be in the future (IST).");return;
  }
  submitLock.current=true;
  setError(null);setNotice(null);setSubmitting(true);
  let saved=0;
  try{
   for(let i=0;i<entries.length;i++){
    const slot=entries[i];
    if (!slot) {
     setError("A proposed time block could not be found. Review the remaining blocks and retry.");
     setQueued(entries.slice(i));
     return;
    }
    const payload=new FormData();
    payload.set("action","CREATE");
    for(const [key,value] of Object.entries(slot))payload.set(key,value);
    const response=await fetch(action,{
     method:"POST",body:payload,credentials:"same-origin",
     headers:{Accept:"application/json"},
    });
    const result=await response.json().catch(()=>null) as {error?:string;id?:string}|null;
    if(!response.ok||!result||typeof result.id!=="string"){
     setQueued(entries.slice(i));
     setStart("");setEnd("");form.reset();setDirty(true);
     const code=result?.error;
     setError((code==="SLOT_OVERLAP"?"An interview overlaps with an existing time block.":
       code==="SLOT_FULL"?"This time block is full.":
       code==="INVALID_SLOT_DATE"?"Enter valid IST start and end times.":
       code==="SLOT_STALE"?"This time block was updated by someone else.":
       "Could not propose this time block. Check the details and retry.")+
       " "+saved+" of "+entries.length+" time blocks were saved. Remaining blocks are kept below.");
     router.refresh();
     return;
    }
    saved++;
   }
   setStart("");setEnd("");setQueued([]);setDirty(false);form.reset();
   setNotice(saved+" interview time block"+(saved===1?"":"s")+
     " proposed. Waiting for placement-cell coordination.");
   router.refresh();
  }catch{
   setQueued(entries.slice(saved));
   setStart("");setEnd("");form.reset();setDirty(true);
   setError("Connection interrupted. "+saved+" of "+entries.length+
     " blocks were saved. Remaining blocks are kept below; retry after checking the list.");
   router.refresh();
  }finally{submitLock.current=false;setSubmitting(false);}
 }
 return <form method="post" action={action} onSubmit={event=>void submit(event)} onChange={()=>setDirty(true)} className="grid min-w-0 gap-4 sm:grid-cols-2">
  <Input type="hidden" name="action" value="CREATE"/>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Interview round
   <Select name="roundId" required={queued.length===0} defaultValue="" className="min-h-11 w-full text-[var(--lms-font-base)] md:min-h-9">
    <option value="" disabled>Select an interview round</option>
    {rounds.map(row=><option key={row.id} value={row.id}>{row.sequence}. {row.name}</option>)}
   </Select>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mode
   <Select name="mode" required defaultValue="VIRTUAL" className="min-h-11 w-full text-[var(--lms-font-base)] md:min-h-9">
    <option value="VIRTUAL">Virtual</option><option value="ON_CAMPUS">On campus</option>
   </Select>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start (IST)
   <Input name="startAt" type="datetime-local" min={today} required={queued.length===0} value={start}
    onChange={event=>{const next=event.target.value;setStart(next);if(end&&end<=next)setEnd("");setError(null);}}
    className="min-h-11 w-full text-sm md:min-h-9"/>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End (IST)
   <Input name="endAt" type="datetime-local" min={start||today} required={queued.length===0} value={end}
    onChange={event=>{setEnd(event.target.value);setError(null);}}
    className="min-h-11 w-full text-sm md:min-h-9"/>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Capacity
   <Input name="capacity" type="number" min={1} max={100} defaultValue={1}
    required className="min-h-11 w-full text-[var(--lms-font-base)] md:min-h-9"/>
  </label>
  <details className="min-w-0 border-t border-border py-2 sm:col-span-2">
   <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-body md:min-h-9">Panel label (not a learner name) · Meeting location</summary>
   <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Panel label (not a learner name)
     <Input name="panelLabel" maxLength={160} className="min-h-11 w-full text-[var(--lms-font-base)] md:min-h-9"/>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Meeting location
     <Input name="meetingLocation" maxLength={500} className="min-h-11 w-full text-[var(--lms-font-base)] md:min-h-9"/>
    </label>
   </div>
  </details>
  {queued.length?<div className="sm:col-span-2 space-y-2" aria-live="polite">
    <p className="text-sm font-semibold text-foreground">Time blocks ready to propose ({queued.length})</p>
    <ol className="space-y-2">
      {queued.map((slot,index)=><li key={index} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm text-body">
        <span>{rounds.find(round=>round.id===slot.roundId)?.name??"Interview"} · {slot.startAt.replace("T"," ")}–{slot.endAt.replace("T"," ")} IST · {slot.capacity} places</span>
        <Button type="button" variant="secondary" disabled={submitting} onClick={()=>{
          setQueued(list=>list.filter((_,i)=>i!==index));setDirty(true);
        }}>Remove</Button>
      </li>)}
    </ol>
   </div>:null}
  <Button type="button" variant="secondary" disabled={!rounds.length||submitting||queued.length>=9}
    onClick={event=>{const form=event.currentTarget.closest("form");if(form)queueSlot(form);}}
    className="min-h-11 w-full sm:col-span-2 md:min-h-9">
    Add another time block
  </Button>
  {!rounds.length?<p role="status" className="text-sm text-muted-foreground sm:col-span-2">No interview rounds are available to propose a slot.</p>:null}
  {error?<div className="sm:col-span-2"><InlineNotice tone="error" message={error}/></div>:null}
  {notice?<div className="md:col-span-2"><InlineNotice tone="success" message={notice}/></div>:null}
  <Button type="submit" disabled={!rounds.length||submitting} loading={submitting} aria-busy={submitting}
    variant="primary" className="min-h-11 w-full sm:col-span-2 md:min-h-9">
    {submitting?"Sending time blocks…":queued.length?"Propose "+(queued.length+(start||end?1:0))+" time blocks":"Propose slot"}
  </Button>
 </form>;
}

export function RecruiterInterviewSlotActions({action,slot}:{
 action:string;slot:{id:string;version:number;status:string;bookedCount:number;capacity:number};
}){
 const router=useRouter();
 const actionLock=useRef(false);
 const [busy,setBusy]=useState<string|null>(null);
 const [confirmCancel,setConfirmCancel]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function act(kind:"OFFER"|"BOOK"|"CANCEL",confirmed=false){
  if(busy||actionLock.current)return;
  if(kind==="CANCEL"&&!confirmed){setConfirmCancel(true);return;}
  actionLock.current=true;
  setBusy(kind);setError(null);
  try{
   const form=new FormData();
   form.set("action",kind);
   form.set("slotId",slot.id);
   form.set("expectedVersion",String(slot.version));
   const response=await fetch(action,{method:"POST",body:form,credentials:"same-origin"});
   const expectedPath=action.replace(/^\/api\/placements\/recruiter/,"/recruiter");
   if(!response.ok||!response.redirected||new URL(response.url).pathname!==expectedPath){
    const payload=await response.json().catch(()=>null) as {error?:string}|null;
    setError(payload?.error==="SLOT_STALE"?"This time block changed. Refresh before retrying.":
     payload?.error==="SLOT_FULL"?"No more reservations are available.":
     payload?.error==="SLOT_OVERLAP"?"The reservation conflicts with another recorded slot.":
     "This time block could not be updated. Refresh and try again.");
    return;
   }
   router.refresh();
  }catch{
   setError("Connection interrupted. Refresh this time block and retry.");
  }finally{actionLock.current=false;setBusy(null);setConfirmCancel(false);}
 }
 return <div className="min-w-0 space-y-3">
  <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
   {slot.status==="PROPOSED"?<Button type="button" disabled={busy!==null} onClick={()=>void act("OFFER")}
    variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Offer time to college</Button>:null}
   {(slot.status==="OFFERED"||slot.status==="BOOKED")&&slot.bookedCount<slot.capacity?
    <Button type="button" disabled={busy!==null} onClick={()=>void act("BOOK")}
     variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Reserve one internal slot</Button>:null}
   {(slot.status==="PROPOSED"||slot.status==="OFFERED")?<Button type="button" disabled={busy!==null}
    onClick={()=>void act("CANCEL")}
    variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel time block</Button>:null}
  </div>
  {!["PROPOSED","OFFERED","BOOKED"].includes(slot.status)?<p className="text-sm text-muted-foreground">No actions available for this time block.</p>:null}
  {busy?<p role="status" className="text-xs text-body">Updating time block…</p>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
 <ConfirmDialog open={confirmCancel} onOpenChange={next=>{if(!next&&!busy)setConfirmCancel(false);}}
     title="Cancel this proposed interview time block?" confirmLabel="Cancel time block"
     confirmVariant="danger" pending={busy!==null}
     onConfirm={()=>void act("CANCEL",true)}>
     {error?<InlineNotice tone="error" message={error}/>:null}
   </ConfirmDialog>
  </div>;
}
