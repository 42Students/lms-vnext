"use client";
import {useEffect,useState} from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export function liveSessionCountdown(startsAt:string,endsAt:string,now:Date):string{
 const start=Date.parse(startsAt),end=Date.parse(endsAt),time=now.getTime();
 // Old LMS keeps a session scheduled when no authored time is available;
 // malformed nonempty timestamps do not justify claiming the room is live.
 if(!startsAt.trim()||!endsAt.trim())return "Scheduled";
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return "Scheduled";
 if(time>=end)return "Ended";
 if(time>=start)return "Live now";
 const remaining=Math.ceil((start-time)/60000);
 if(remaining>=1440){
  const days=Math.floor(remaining/1440),hours=Math.floor(remaining%1440/60);
  return "Starts in "+days+" "+(days===1?"day":"days")+(hours?" "+hours+" h":"");
 }
 const hours=Math.floor(remaining/60);
 const minutes=remaining%60;
 return hours>0?`Starts in ${hours} h ${minutes} min`:`Starts in ${minutes} min`;
}
export function LearnerLiveSessionStatus({startsAt,endsAt}:{
 startsAt:string;endsAt:string;
}){
 const [label,setLabel]=useState("Scheduled");
 useEffect(()=>{
  const update=()=>setLabel(liveSessionCountdown(startsAt,endsAt,new Date()));
  const initial=window.setTimeout(update,0);
  const timer=window.setInterval(update,30000);
  return ()=>{window.clearTimeout(initial);window.clearInterval(timer);};
 },[startsAt,endsAt]);
 const date=Date.parse(startsAt);
 return <section role="status" aria-live="polite" className="mt-2 flex min-w-0 flex-wrap items-center gap-3 rounded border-l-2 border-[var(--lms-primary)] bg-primary-subtle px-3 py-3">
  {Number.isFinite(date)?<div aria-hidden="true" className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded bg-surface text-center">
   <span className="text-[10px] font-semibold uppercase">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",month:"short"}).format(date)}</span>
   <strong className="text-xl tabular-nums">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric"}).format(date)}</strong>
  </div>:null}
  <span aria-hidden="true" className={"inline-block size-2 shrink-0 rounded-full "+(label==="Live now"?"animate-pulse bg-success":"bg-primary")}/>
  <div className="min-w-0"><StatusBadge tone={label==="Live now"?"success":label==="Ended"||label==="Scheduled"?"neutral":"info"}>{label}</StatusBadge>
   <p className="mt-1 text-xs text-body">Live session · Time displayed in IST</p>
  </div>
 </section>;
}
