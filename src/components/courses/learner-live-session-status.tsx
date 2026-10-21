"use client";
import {useEffect,useState} from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export function liveSessionCountdown(startsAt:string,endsAt:string,now:Date):string{
 const start=Date.parse(startsAt),end=Date.parse(endsAt),time=now.getTime();
 // Old LMS keeps a session scheduled when no authored time is available;
 // malformed nonempty timestamps do not justify claiming the room is live.
 if(!startsAt.trim()||!endsAt.trim())return "Scheduled";
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return "Timing unknown";
 if(time>=end)return "Ended";
 if(time>=start)return "Live now";
 const remaining=Math.ceil((start-time)/60000);
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
 return <p role="status" className="mt-2"><StatusBadge tone={label==="Live now"?"success":label==="Timing unknown"?"warning":label==="Ended"||label==="Scheduled"?"neutral":"info"}>{label}</StatusBadge></p>;
}
