"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";

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
 const [submitting,setSubmitting]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const [start,setStart]=useState("");
 const [end,setEnd]=useState("");
 const [error,setError]=useState<string|null>(null);
 const today=nowInIst();
 async function submit(event:FormEvent<HTMLFormElement>){
  const form=event.currentTarget;
  const current=nowInIst();
  if(!start||!end){event.preventDefault();setError("Select both interview start and end times.");return;}
  if(start<current){event.preventDefault();setError("Interview time must be in the future (IST).");return;}
  if(end<=start){event.preventDefault();setError("End time must be after start time.");return;}
  event.preventDefault();
  if(submitting)return;
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
   setStart("");setEnd("");form.reset();
   setNotice("Interview time block proposed. Waiting for placement-cell coordination.");
   router.refresh();
  }catch{
   setError("Could not reach the server. Your entered times are still here.");
  }finally{setSubmitting(false);}
 }
 return <form method="post" action={action} onSubmit={event=>void submit(event)} className="grid gap-3 sm:grid-cols-2">
  <input type="hidden" name="action" value="CREATE"/>
  <label className="grid gap-1 text-sm text-body">Interview round
   <select name="roundId" required defaultValue="" className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="" disabled>Select an interview round</option>
    {rounds.map(row=><option key={row.id} value={row.id}>{row.sequence}. {row.name}</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm text-body">Mode
   <select name="mode" required defaultValue="VIRTUAL" className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="VIRTUAL">Virtual</option><option value="ON_CAMPUS">On campus</option>
   </select>
  </label>
  <label className="grid gap-1 text-sm text-body">Start (IST)
   <input name="startAt" type="datetime-local" min={today} required value={start}
    onChange={event=>{const next=event.target.value;setStart(next);if(end&&end<=next)setEnd("");setError(null);}}
    className="min-h-11 rounded-md border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm text-body">End (IST)
   <input name="endAt" type="datetime-local" min={start||today} required value={end}
    onChange={event=>{setEnd(event.target.value);setError(null);}}
    className="min-h-11 rounded-md border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm text-body">Capacity
   <input name="capacity" type="number" min={1} max={100} defaultValue={1}
    required className="min-h-11 rounded-md border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm text-body">Panel label (not a learner name)
   <input name="panelLabel" maxLength={160} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm text-body sm:col-span-2">Meeting location
   <input name="meetingLocation" maxLength={500} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
  </label>
  {error?<p role="alert" className="sm:col-span-2 rounded-md border border-error p-3 text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="sm:col-span-2 text-sm text-body">{notice}</p>:null}
  <button type="submit" disabled={!rounds.length||submitting} aria-busy={submitting}
    className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary sm:col-span-2 disabled:opacity-50">
    {submitting?"Sending time block…":"Propose slot"}
  </button>
 </form>;
}
