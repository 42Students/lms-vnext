"use client";
import {useEffect,useState} from "react";

export function liveSessionCountdown(startsAt:string,endsAt:string,now:Date):string{
 const start=Date.parse(startsAt),end=Date.parse(endsAt),time=now.getTime();
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return "Time unavailable";
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
 return <p role="status" className="mt-2 text-sm font-semibold text-body">{label}</p>;
}
