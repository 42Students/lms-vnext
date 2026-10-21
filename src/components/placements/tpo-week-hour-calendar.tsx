"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { InlineNotice } from "@/components/ui/inline-notice";
import weekStyles from "./tpo-week-hour-calendar.module.css";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect,useMemo,useRef,useState} from "react";
import {positionWeekEvents,type WeekGridEvent} from "@/modules/placements/tpo-week-grid-model";
import {calendarLocalIstToOffset,calendarDueAtToIstLocal} from "@/modules/placements/tpo-calendar-followup-model";
import {TpoCalendarMoveFollowup,type TpoCalendarLeadOption} from "./tpo-calendar-followup-actions";

/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

const FIRST=7,LAST=21,HEIGHT=52;
type WeekConfirm =
 | {kind:"MOVE";followupId:string;day:string;hour:number;prompts:string[];index:number}
 | {kind:"ADD";prompts:string[];index:number}
 | {kind:"DISCARD";prompts:string[];index:number}
 | {kind:"LEAVE";href:string;prompts:string[];index:number};
const label=(day:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",weekday:"short",day:"numeric",month:"short"})
 .format(new Date(day+"T12:00:00Z"));
const clock=(hour:number)=>new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",hour:"numeric",hour12:true})
 .format(new Date(Date.UTC(2026,0,1,hour)));
const kinds:Record<string,string>={ROUND:"Round",FOLLOW_UP:"Follow-up",APPLICATION_DEADLINE:"Deadline",INTERVIEW_SLOT:"Interview"};
const tone=(kind:string)=>kind==="APPLICATION_DEADLINE"?"bg-warning-subtle text-[var(--lms-gold-accent)]":kind==="FOLLOW_UP"?
 "bg-success-subtle text-success-text":"bg-primary-subtle text-primary-text";
export function TpoWeekHourCalendar({days,events,collegeId,canCreate,nowIso,blockedDates,blockedDatesAvailable}:{
 days:readonly string[];events:readonly WeekGridEvent[];collegeId:string;
 canCreate:boolean;nowIso:string;blockedDates:readonly string[];blockedDatesAvailable:boolean;
}){
 const router=useRouter();
 const blocked=new Set(blockedDates);
 const [slot,setSlot]=useState<string|null>(null);
 const [move,setMove]=useState<{id:string;currentIst:string}|null>(null);
 const triggerRef=useRef<HTMLButtonElement|null>(null);
 const allowUnload=useRef(false);
 const [review,setReview]=useState<WeekConfirm|null>(null);
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
 async function open(day:string,hour:number,trigger?:HTMLButtonElement){
  triggerRef.current=trigger??null;
  if(!canCreate)return;
  const selected=day+"T"+String(hour).padStart(2,"0")+":00";
  try{
   if(new Date(calendarLocalIstToOffset(selected)).getTime()<=currentTimeMs()){
    setMessage("Pick a future date and time");return;
   }
  }catch{setMessage("Invalid IST time.");return;}
  setMessage("");setLeadId("");setLeadQuery("");setNote("");
  setSlot(selected);
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
 async function moveFollowup(followupId:string,day:string,hour:number,confirmed=false){
  if(!canCreate||saving)return;
  let dueAt:string;
  try{dueAt=calendarLocalIstToOffset(day+"T"+String(hour).padStart(2,"0")+":00");}
  catch{setMessage("The selected IST time is invalid.");return;}
  if(new Date(dueAt).getTime()<=currentTimeMs()){setMessage("Pick a future date and time");return;}
  if(!confirmed){
   const prompts=[
    ...(blocked.has(day)?["This date is blocked in placement settings. Move the follow-up here anyway?"]:[]),
    ...(!blockedDatesAvailable?["Blocked dates could not be checked. Move this follow-up anyway?"]:[]),
    "Move this follow-up to "+label(day)+" at "+clock(hour)+" IST?",
   ];
   setReview({kind:"MOVE",followupId,day,hour,prompts,index:0});
   return;
  }
  setSaving(true);setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/calendar/follow-ups/"+encodeURIComponent(followupId),{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({dueAt}),
   });
   if(!response.ok)throw Error("Could not move the follow-up.");
   router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Could not move the follow-up.");}
  finally{setSaving(false);}
 }
 async function save(confirmed=false){
  if(!slot||saving||!leadId)return;
  let dueAt:string;
  try{dueAt=calendarLocalIstToOffset(slot);}catch{setMessage("Invalid IST time.");return;}
  if(new Date(dueAt).getTime()<=new Date().getTime()){setMessage("Pick a future date and time");return;}
  if(!confirmed){
   const prompts=[
    ...(blocked.has(slot.slice(0,10))?["This date is blocked in placement settings. Add the follow-up anyway?"]:[]),
    ...(!blockedDatesAvailable?["Blocked dates are unavailable. Add the follow-up without checking?"]:[]),
   ];
   if(prompts.length){setReview({kind:"ADD",prompts,index:0});return;}
  }
  setSaving(true);setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/calendar/follow-ups",{method:"POST",
    credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({leadId,dueAt,note:note.trim()||null})});
   if(!response.ok)throw Error("Could not create recruiter follow-up.");
   setSlot(null);triggerRef.current?.focus();router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Could not create follow-up.");}
  finally{setSaving(false);}
 }
 const hasDraft=Boolean(slot&&(note.trim()||leadId||leadQuery.trim()));
 useEffect(()=>{
  if(!hasDraft)return;
  const prevent=(event:BeforeUnloadEvent)=>{
   if(allowUnload.current)return;
   event.preventDefault();event.returnValue="";
  };
  const protectLinks=(event:MouseEvent)=>{
   const target=event.target;
   const link=target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
   if(!link||link.hasAttribute("download")||allowUnload.current)return;
   event.preventDefault();event.stopPropagation();
   setReview({kind:"LEAVE",href:link.href,prompts:["Discard this unfinished follow-up?"],index:0});
  };
  window.addEventListener("beforeunload",prevent);
  document.addEventListener("click",protectLinks,true);
  return ()=>{window.removeEventListener("beforeunload",prevent);document.removeEventListener("click",protectLinks,true);};
 },[hasDraft]);
 function cancelDraft(confirmed=false){
  if(hasDraft&&!confirmed){
   setReview({kind:"DISCARD",prompts:["Discard this unfinished follow-up?"],index:0});
   return;
  }
  setSlot(null);setMessage("");if(triggerRef.current?.isConnected)triggerRef.current.focus();
 }
 const height=(LAST-FIRST)*HEIGHT;
 return <section aria-label="TPO weekly time calendar" className="space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="font-semibold">Week · 7 AM to 9 PM IST</h2>
   <label className="grid w-full min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-body-text)] sm:w-64 text-[var(--lms-neutral-400)]">Find an event
    <Input type="search" value={filter} onChange={e=>setFilter(e.target.value)} maxLength={100}
     placeholder="Company or event"/>
   </label>
  </div>
  <details className="text-[13px] leading-5 text-[var(--lms-muted-text)]"><summary className="w-fit cursor-pointer font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] max-[767px]:flex max-[767px]:min-h-11 max-[767px]:items-center">How to use this calendar</summary><p className="mt-[var(--lms-space-2)] max-w-prose">Click an empty hour to add a recruiter follow-up, or drag an existing follow-up onto another hour to move it. Events with an unknown duration use a 30-minute visual marker; it is not a booked time range. Overlapping events share their time lane.</p></details>
  <div tabIndex={0} role="region" aria-label="Recruiter follow-up weekly calendar, scroll horizontally for more days" className={"overflow-x-auto overscroll-x-contain bg-surface focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] "+weekStyles.grid}>
   <div className={"grid min-w-[56rem] "+weekStyles.weekColumns}>
    <div className={"sticky left-0 z-10 border-b border-r bg-surface "+weekStyles.corner}>IST</div>
    {days.map(day=><div key={day} className={"border-b border-r text-center text-xs font-semibold "+weekStyles.dayHead}>
     {label(day)}{day===today?" · Today":""}{blocked.has(day)?" · Blocked":""}
    </div>)}
    <div className="relative border-r border-border bg-surface" style={{height}}>
     {Array.from({length:LAST-FIRST},(_,offset)=><div key={offset} className="absolute w-full border-t border-border"
       style={{top:offset*HEIGHT}}><span className={weekStyles.hourMarker}>{clock(FIRST+offset)}</span></div>)}
    </div>
    {days.map(day=>{
     const positioned=(byDay.get(day)??[]).filter(e=>!filter.trim()||
      [e.title,e.companyName,e.roundKind??""].some(x=>x.toLocaleLowerCase("en-IN").includes(filter.trim().toLocaleLowerCase("en-IN"))));
     const offHours=positioned.filter(e=>e.outsideHours);
     const inHours=positioned.filter(e=>!e.outsideHours);
     return <div key={day} className={"relative border-r "+weekStyles.dayColumn} style={{height}} aria-label={label(day)+" events"}>
      {Array.from({length:LAST-FIRST},(_,offset)=><Button variant="ghost" key={offset} type="button"
       aria-label={"Add follow-up on "+label(day)+" at "+clock(FIRST+offset)}
       disabled={!canCreate||saving} onClick={clickEvent=>void open(day,FIRST+offset,clickEvent.currentTarget)}
       onDragOver={event=>{if(canCreate){event.preventDefault();event.dataTransfer.dropEffect="move";}}}
       onDrop={event=>{
        event.preventDefault();const followupId=event.dataTransfer.getData("application/x-tpo-followup");
        if(followupId)void moveFollowup(followupId,day,FIRST+offset);
       }}
       className={"absolute inset-x-0 z-0 border-b px-1 text-left focus-visible:z-20 "+weekStyles.slot}
       style={{top:offset*HEIGHT,height:HEIGHT}}/>)}
      {day===today&&nowMinutes>=FIRST*60&&nowMinutes<=LAST*60?
       <div aria-label="Current time" className={"pointer-events-none absolute inset-x-0 border-t-2 "+weekStyles.nowLine}
        style={{top:(nowMinutes-FIRST*60)/60*HEIGHT}}/>:null}
      {inHours.map(event=>{
       const top=Math.max(0,(event.startMinute-FIRST*60)/60*HEIGHT);
       const blockHeight=Math.max(22,(event.endMinute-event.startMinute)/60*HEIGHT);
       const position={top,height:blockHeight,
        left:"calc("+(event.column/event.columns*100)+"% + 2px)",
        width:"calc("+(100/event.columns)+"% - 4px)"};
       const inner=<><strong className="block truncate min-w-0">{event.title}</strong>
        <span className="block truncate min-w-0">{event.companyName}</span>
        <span className="block text-xs">{kinds[event.kind]??event.kind}</span></>;
       return canCreate&&event.followupId&&event.status==="OPEN"?
        <Button variant="ghost" key={event.id} type="button"
         aria-label={"Move follow-up: "+event.title} data-event-kind={event.kind}
         draggable onDragStart={dragEvent=>{dragEvent.dataTransfer.setData("application/x-tpo-followup",event.followupId!);dragEvent.dataTransfer.effectAllowed="move";}}
         onClick={()=>setMove({id:event.followupId!,currentIst:calendarDueAtToIstLocal(new Date(event.startsAt))})}
         style={position} className={"absolute z-10 overflow-hidden px-1 py-0.5 text-left "+tone(event.kind)+" "+weekStyles.event+" !min-h-0 !max-w-none !rounded-[var(--lms-control-radius)]"}>{inner}</Button>:
       event.href?<Link key={event.id} href={event.href} title={event.companyName+" · "+event.title} data-event-kind={event.kind}
        draggable={canCreate&&Boolean(event.followupId)}
        onDragStart={dragEvent=>{
         if(!event.followupId)return;
         dragEvent.dataTransfer.setData("application/x-tpo-followup",event.followupId);
         dragEvent.dataTransfer.effectAllowed="move";
        }}
        style={position} className={"absolute z-10 overflow-hidden px-1 py-0.5 "+tone(event.kind)+" "+weekStyles.event}>{inner}</Link>:
       <div key={event.id} data-event-kind={event.kind} style={position} className={"absolute z-10 overflow-hidden px-1 py-0.5 "+tone(event.kind)+" "+weekStyles.event}>{inner}</div>;
      })}
      {offHours.length?<div className="absolute inset-x-0 bottom-0 z-20 space-y-1 border-t border-border bg-surface/95 p-1">
       {offHours.map(e=><p key={e.id} className="truncate text-xs min-w-0" title={e.title}>Outside displayed hours · {e.title}</p>)}
      </div>:null}
     </div>;
    })}
   </div>
  </div>
  {move?<Dialog open={Boolean(move)} onOpenChange={next=>{if(!next)setMove(null);}} title="Move follow-up" className="max-w-lg">
      <TpoCalendarMoveFollowup followupId={move.id} currentIst={move.currentIst} />
      <Button variant="secondary" type="button" onClick={()=>setMove(null)}
        className="mt-[var(--lms-space-3)] w-full md:w-auto">Close</Button>
  </Dialog>:null}
  {!slot&&message?<InlineNotice tone="error" message={message}/>:null}
  {slot?<Dialog open={Boolean(slot)} onOpenChange={next=>{if(!next&&!saving)cancelDraft();}} dismissible={!saving} title="New recruiter follow-up" className="max-w-md">
   <div className="space-y-3">
    {slot&&blocked.has(slot.slice(0,10))?<Alert tone="warning">This day is blocked for placement scheduling. Choose another date if possible.</Alert>:null}
    {!blockedDatesAvailable?<Alert tone="warning">Blocked-date settings could not be loaded. Scheduling is not confirmed conflict-free.</Alert>:null}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Date and time (IST)
     <Input type="datetime-local" value={slot} onChange={e=>setSlot(e.target.value)}
      className=""/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search recruiter lead
     <Input value={leadQuery} onChange={e=>{setLeadQuery(e.target.value);setLeadId("");}}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3" maxLength={120}/>
     <Select value={leadId} disabled={loadingLeads} required onChange={e=>setLeadId(e.target.value)}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3">
      <option value="">{loadingLeads?"Loading recruiters…":"Choose recruiter"}</option>
      {matches.map(lead=><option key={lead.id} value={lead.id}>{lead.name}{lead.companyName?" · "+lead.companyName:""}</option>)}
     </Select></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Note (optional)
     <Textarea value={note} maxLength={500} onChange={e=>setNote(e.target.value)}
      className=""/></label>
    {message?<InlineNotice tone="error" message={message}/>:null}
    <div className="flex flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end">
     <Button variant="secondary" type="button" disabled={saving} onClick={()=>cancelDraft()}
      className="w-full md:w-auto">Cancel</Button>
     <Button variant="primary" type="button" loading={saving} disabled={saving||loadingLeads||!leadId||!slot} onClick={()=>void save()}
      className="w-full md:w-auto">{saving?"Saving…":"Add follow-up"}</Button>
    </div>
   </div>
  </Dialog>:null}
  <ConfirmDialog open={review !== null}
   onOpenChange={next => {if(!next&&!saving)setReview(null);}}
   title={review?.kind==="MOVE"?"Confirm follow-up move?" :
    review?.kind==="ADD"?"Confirm blocked-date follow-up?" :
    review?.kind==="LEAVE"?"Leave unfinished follow-up?":"Discard unfinished follow-up?"}
   description={review?.prompts[review.index]??""}
   confirmLabel={review?.kind==="LEAVE"||review?.kind==="DISCARD"?"Discard":
    review !== null && review.index === review.prompts.length-1?"Confirm":"Continue"}
   confirmVariant={review?.kind==="LEAVE"||review?.kind==="DISCARD"?"danger":"primary"}
   pending={saving} onConfirm={()=>{
    if(!review)return;
    if(review.index+1<review.prompts.length){
     setReview({...review,index:review.index+1});
     return;
    }
    setReview(null);
    if(review.kind==="MOVE")void moveFollowup(review.followupId,review.day,review.hour,true);
    else if(review.kind==="ADD")void save(true);
    else if(review.kind==="DISCARD")cancelDraft(true);
    else {
     cancelDraft(true);
     const href=new URL(review.href,window.location.href);
     allowUnload.current=true;
     if(href.origin===window.location.origin)router.push(href.pathname+href.search+href.hash);
     else window.location.assign(href.href);
    }
   }}/>
 </section>;
}
