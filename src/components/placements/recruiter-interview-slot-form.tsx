"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";

type InterviewRound={id:string;name:string;sequence:number};
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
 const today=nowInIst();
 useEffect(()=>{
  if(!dirty||submitting)return;
  const onExit=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",onExit);
  return ()=>window.removeEventListener("beforeunload",onExit);
 },[dirty,submitting]);
 async function submit(event:FormEvent<HTMLFormElement>){
  const form=event.currentTarget;
  const current=nowInIst();
  if(!start||!end){event.preventDefault();setError("Select both interview start and end times.");return;}
  if(start<current){event.preventDefault();setError("Interview time must be in the future (IST).");return;}
  if(end<=start){event.preventDefault();setError("End time must be after start time.");return;}
  event.preventDefault();
  if(submitLock.current)return;
  submitLock.current=true;
  setError(null);setNotice(null);setSubmitting(true);
  try{
   const response=await fetch(action,{
    method:"POST",body:new FormData(form),credentials:"same-origin",
   });
   const expectedPath=action.replace(/^\/api\/placements\/recruiter/,"/recruiter");
   const target=new URL(response.url);
   if(!response.ok||!response.redirected||target.pathname!==expectedPath){
    const result=await response.json().catch(()=>null) as {error?:string}|null;
    const code=result?.error;
    setError(code==="SLOT_STALE"?"This time block was updated by someone else. Refresh and try again.":
      code==="SLOT_FULL"?"This time block is full.":
      code==="SLOT_OVERLAP"?"This interview overlaps with an existing time block.":
      code==="INVALID_SLOT_DATE"?"Enter a valid IST start and end time.":
      "Could not propose this slot. Check the details and retry.");
    return;
   }
   setStart("");setEnd("");setDirty(false);form.reset();
   setNotice("Interview time block proposed. Waiting for placement-cell coordination.");
   router.refresh();
  }catch{
   setError("Could not reach the server. Your entered times are still here.");
  }finally{submitLock.current=false;setSubmitting(false);}
 }
 return <form method="post" action={action} onSubmit={event=>void submit(event)} onChange={()=>setDirty(true)} className="grid gap-3 sm:grid-cols-2">
  <input type="hidden" name="action" value="CREATE"/>
  <label className="grid gap-1 text-sm text-body">Interview round
   <Select name="roundId" required defaultValue="" className="text-sm">
    <option value="" disabled>Select an interview round</option>
    {rounds.map(row=><option key={row.id} value={row.id}>{row.sequence}. {row.name}</option>)}
   </Select>
  </label>
  <label className="grid gap-1 text-sm text-body">Mode
   <Select name="mode" required defaultValue="VIRTUAL" className="text-sm">
    <option value="VIRTUAL">Virtual</option><option value="ON_CAMPUS">On campus</option>
   </Select>
  </label>
  <label className="grid gap-1 text-sm text-body">Start (IST)
   <Input name="startAt" type="datetime-local" min={today} required value={start}
    onChange={event=>{const next=event.target.value;setStart(next);if(end&&end<=next)setEnd("");setError(null);}}
    className="text-sm"/>
  </label>
  <label className="grid gap-1 text-sm text-body">End (IST)
   <Input name="endAt" type="datetime-local" min={start||today} required value={end}
    onChange={event=>{setEnd(event.target.value);setError(null);}}
    className="text-sm"/>
  </label>
  <label className="grid gap-1 text-sm text-body">Capacity
   <Input name="capacity" type="number" min={1} max={100} defaultValue={1}
    required className="text-sm"/>
  </label>
  <label className="grid gap-1 text-sm text-body">Panel label (not a learner name)
   <Input name="panelLabel" maxLength={160} className="text-sm"/>
  </label>
  <label className="grid gap-1 text-sm text-body sm:col-span-2">Meeting location
   <Input name="meetingLocation" maxLength={500} className="text-sm"/>
  </label>
  {error?<p role="alert" className="sm:col-span-2 rounded-[var(--lms-control-radius)] border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="sm:col-span-2 text-sm text-body">{notice}</p>:null}
  <Button type="submit" disabled={!rounds.length||submitting} aria-busy={submitting}
    variant="primary" className="sm:col-span-2">
    {submitting?"Sending time block…":"Propose slot"}
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
 return <div className="space-y-2">
  <div className="flex flex-wrap gap-2">
   {slot.status==="PROPOSED"?<Button type="button" disabled={busy!==null} onClick={()=>void act("OFFER")}
    variant="secondary">Offer time to college</Button>:null}
   {(slot.status==="OFFERED"||slot.status==="BOOKED")&&slot.bookedCount<slot.capacity?
    <Button type="button" disabled={busy!==null} onClick={()=>void act("BOOK")}
     variant="secondary">Reserve one internal slot</Button>:null}
   {(slot.status==="PROPOSED"||slot.status==="OFFERED")?<Button type="button" disabled={busy!==null}
    onClick={()=>void act("CANCEL")}
    variant="secondary">Cancel time block</Button>:null}
  </div>
  {busy?<p role="status" className="text-xs text-body">Updating time block…</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 <ConfirmDialog open={confirmCancel} onOpenChange={setConfirmCancel}
     title="Cancel this proposed interview time block?" confirmLabel="Cancel time block"
     confirmVariant="danger" pending={busy!==null}
     onConfirm={()=>void act("CANCEL",true)}>
     {error?<p role="alert" className="text-sm text-foreground">{error}</p>:null}
   </ConfirmDialog>
  </div>;
}
