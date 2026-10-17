"use client";
import {useState,type FormEvent} from "react";

type InterviewRound={id:string;name:string;sequence:number};
/** Times are the form's declared India Standard Time, not browser-local time. */
function nowInIst(){
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date()).replace(" ","T");
}
export function RecruiterInterviewSlotForm({action,rounds}:{action:string;rounds:readonly InterviewRound[]}){
 const [start,setStart]=useState("");
 const [end,setEnd]=useState("");
 const [error,setError]=useState<string|null>(null);
 const today=nowInIst();
 function validate(event:FormEvent<HTMLFormElement>){
  const current=nowInIst();
  if(!start||!end){event.preventDefault();setError("Select both interview start and end times.");return;}
  if(start<current){event.preventDefault();setError("Interview time must be in the future (IST).");return;}
  if(end<=start){event.preventDefault();setError("End time must be after start time.");return;}
  setError(null);
 }
 return <form method="post" action={action} onSubmit={validate} className="grid gap-3 sm:grid-cols-2">
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
    onChange={event=>{setStart(event.target.value);setError(null);}}
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
  <button type="submit" disabled={!rounds.length} className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary sm:col-span-2 disabled:opacity-50">Propose slot</button>
 </form>;
}
