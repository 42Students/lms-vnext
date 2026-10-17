"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useMemo,useState} from "react";
import {positionWeekEvents,type WeekGridEvent} from "@/modules/placements/tpo-week-grid-model";
import {calendarLocalIstToOffset} from "@/modules/placements/tpo-calendar-followup-model";
import type {TpoCalendarLeadOption} from "./tpo-calendar-followup-actions";
const FIRST=7,LAST=21,HEIGHT=64;
const label=(day:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",weekday:"short",day:"numeric",month:"short"})
 .format(new Date(day+"T12:00:00Z"));
const clock=(hour:number)=>new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",hour:"numeric",hour12:true})
 .format(new Date(Date.UTC(2026,0,1,hour)));
const kinds:Record<string,string>={ROUND:"Round",FOLLOW_UP:"Follow-up",APPLICATION_DEADLINE:"Deadline",INTERVIEW_SLOT:"Interview"};
const tone=(kind:string)=>kind==="APPLICATION_DEADLINE"?"bg-warning-subtle text-warning-text":kind==="FOLLOW_UP"?
 "bg-success-subtle text-success-text":"bg-primary-subtle text-primary-text";
export function TpoWeekHourCalendar({days,events,collegeId,canCreate,nowIso}:{
 days:readonly string[];events:readonly WeekGridEvent[];collegeId:string;
 canCreate:boolean;nowIso:string;
}){
 const router=useRouter();
 const [slot,setSlot]=useState<string|null>(null);
 const [leads,setLeads]=useState<TpoCalendarLeadOption[]>([]);
 const [loadingLeads,setLoadingLeads]=useState(false);
 const [leadQuery,setLeadQuery]=useState("");
 const [leadId,setLeadId]=useState("");
 const [note,setNote]=useState("");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [filter,setFilter]=useState("");
 const byDay=useMemo(()=>new Map(days.map(day=>[day,positionWeekEvents(events.filter(e=>
  new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"})
   .format(new Date(e.startsAt))===day))])),[days,events]);
 const matches=leads.filter(lead=>[lead.name,lead.companyName??"",lead.email??""].some(x=>
  x.toLocaleLowerCase("en-IN").includes(leadQuery.trim().toLocaleLowerCase("en-IN")))).slice(0,50);
 const current=new Date(nowIso),hourParts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(current);
 const nowMinutes=Number(hourParts.find(p=>p.type==="hour")?.value??0)*60+Number(hourParts.find(p=>p.type==="minute")?.value??0);
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(current);
 async function open(day:string,hour:number){
  if(!canCreate)return;
  setMessage("");setLeadId("");setLeadQuery("");setNote("");
  setSlot(day+"T"+String(hour).padStart(2,"0")+":00");
  setLoadingLeads(true);
  try{
   const response=await fetch("/api/placements/tpo/leads?collegeId="+encodeURIComponent(collegeId),{
    cache:"no-store",credentials:"same-origin",
   });
   if(!response.ok)throw Error("Could not load recruiter leads.");
   const raw=await response.json() as {leads?:TpoCalendarLeadOption[]};
   setLeads(Array.isArray(raw.leads)?raw.leads:[]);
  }catch(error){setMessage(error instanceof Error?error.message:"Could not load leads.");}
  finally{setLoadingLeads(false);}
 }
 async function save(){
  if(!slot||saving||!leadId)return;
  let dueAt:string;
  try{dueAt=calendarLocalIstToOffset(slot);}catch{setMessage("Invalid IST time.");return;}
  if(new Date(dueAt).getTime()<=Date.now()){setMessage("Follow-up must be in the future.");return;}
  setSaving(true);setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/calendar/follow-ups",{method:"POST",
    credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({leadId,dueAt,note:note.trim()||null})});
   if(!response.ok)throw Error("Could not create recruiter follow-up.");
   setSlot(null);router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Could not create follow-up.");}
  finally{setSaving(false);}
 }
 const height=(LAST-FIRST)*HEIGHT;
 return <section aria-label="TPO weekly time calendar" className="space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="font-semibold">Week · 7 AM to 9 PM IST</h2>
   <label className="text-sm">Find an event
    <input type="search" value={filter} onChange={e=>setFilter(e.target.value)} maxLength={100}
     className="ml-2 min-h-10 rounded border border-border bg-surface px-2" placeholder="Company or event"/>
   </label>
  </div>
  <p className="text-xs text-muted-foreground">Click an empty hour to add a recruiter follow-up. Events with an unknown duration use a 30-minute visual marker; it is not a booked time range. Overlapping events share their time lane.</p>
  <div className="overflow-x-auto rounded-xl border border-border bg-surface">
   <div className="grid min-w-[63rem] grid-cols-[5rem_repeat(7,minmax(0,1fr))]">
    <div className="sticky left-0 z-10 border-b border-r border-border bg-surface p-2 text-xs">IST</div>
    {days.map(day=><div key={day} className="border-b border-r border-border p-3 text-center text-xs font-semibold">
     {label(day)}{day===today?" · Today":""}
    </div>)}
    <div className="relative border-r border-border bg-surface" style={{height}}>
     {Array.from({length:LAST-FIRST},(_,offset)=><div key={offset} className="absolute w-full border-t border-border pl-1 text-xs text-muted-foreground"
       style={{top:offset*HEIGHT}}>{clock(FIRST+offset)}</div>)}
    </div>
    {days.map(day=>{
     const positioned=(byDay.get(day)??[]).filter(e=>!filter.trim()||
      [e.title,e.companyName,e.roundKind??""].some(x=>x.toLocaleLowerCase("en-IN").includes(filter.trim().toLocaleLowerCase("en-IN"))));
     const offHours=positioned.filter(e=>e.outsideHours);
     const inHours=positioned.filter(e=>!e.outsideHours);
     return <div key={day} className="relative border-r border-border" style={{height}} aria-label={label(day)+" events"}>
      {Array.from({length:LAST-FIRST},(_,offset)=><button key={offset} type="button"
       aria-label={"Add follow-up on "+label(day)+" at "+clock(FIRST+offset)}
       disabled={!canCreate} onClick={()=>void open(day,FIRST+offset)}
       className="absolute inset-x-0 border-t border-border text-left text-xs hover:bg-primary-subtle focus-visible:z-20 focus-visible:outline-2 disabled:cursor-default"
       style={{top:offset*HEIGHT,height:HEIGHT}}/>)}
      {day===today&&nowMinutes>=FIRST*60&&nowMinutes<=LAST*60?
       <div aria-label="Current time" className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-warning"
        style={{top:(nowMinutes-FIRST*60)/60*HEIGHT}}/>:null}
      {inHours.map(event=>{
       const top=Math.max(0,(event.startMinute-FIRST*60)/60*HEIGHT);
       const blockHeight=Math.max(24,(event.endMinute-event.startMinute)/60*HEIGHT);
       const position={top,height:blockHeight,left:(event.column/event.columns*100)+"%",
        width:(100/event.columns)+"%"};
       const inner=<><strong className="block truncate">{event.title}</strong>
        <span className="block truncate">{event.companyName}</span>
        <span className="block text-[10px]">{kinds[event.kind]??event.kind}</span></>;
       return event.href?<Link key={event.id} href={event.href} title={event.companyName+" · "+event.title}
        style={position} className={"absolute z-10 overflow-hidden rounded border border-border px-1 py-0.5 text-[11px] leading-tight "+tone(event.kind)}>{inner}</Link>:
       <div key={event.id} style={position} className={"absolute z-10 overflow-hidden rounded border border-border px-1 py-0.5 text-[11px] leading-tight "+tone(event.kind)}>{inner}</div>;
      })}
      {offHours.length?<div className="absolute inset-x-0 bottom-0 z-20 space-y-1 border-t border-border bg-surface/95 p-1">
       {offHours.map(e=><p key={e.id} className="truncate text-[10px]" title={e.title}>Outside displayed hours · {e.title}</p>)}
      </div>:null}
     </div>;
    })}
   </div>
  </div>
  {slot?<div role="dialog" aria-modal="true" aria-label="New recruiter follow-up" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-surface p-5">
    <h2 className="text-lg font-semibold">New recruiter follow-up</h2>
    <label className="grid gap-1 text-sm">Date and time (IST)
     <input type="datetime-local" value={slot} onChange={e=>setSlot(e.target.value)}
      className="min-h-11 rounded border border-border px-3"/></label>
    <label className="grid gap-1 text-sm">Search recruiter lead
     <input value={leadQuery} onChange={e=>{setLeadQuery(e.target.value);setLeadId("");}}
      className="min-h-11 rounded border border-border px-3" maxLength={120}/>
     <select value={leadId} disabled={loadingLeads} required onChange={e=>setLeadId(e.target.value)}
      className="min-h-11 rounded border border-border px-3">
      <option value="">{loadingLeads?"Loading recruiters…":"Choose recruiter"}</option>
      {matches.map(lead=><option key={lead.id} value={lead.id}>{lead.name}{lead.companyName?" · "+lead.companyName:""}</option>)}
     </select></label>
    <label className="grid gap-1 text-sm">Note (optional)
     <textarea value={note} maxLength={500} onChange={e=>setNote(e.target.value)}
      className="rounded border border-border p-2"/></label>
    {message?<p role="alert" className="text-sm text-warning-text">{message}</p>:null}
    <div className="flex justify-end gap-2">
     <button type="button" disabled={saving} onClick={()=>setSlot(null)}
      className="min-h-11 rounded border border-border px-4 text-sm">Cancel</button>
     <button type="button" disabled={saving||loadingLeads||!leadId||!slot} onClick={()=>void save()}
      className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">{saving?"Saving…":"Add follow-up"}</button>
    </div>
   </div>
  </div>:null}
 </section>;
}
