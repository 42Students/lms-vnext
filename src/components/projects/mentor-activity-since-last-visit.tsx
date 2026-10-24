"use client";

import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";

/** Source activity events have no per-user read cursors. Keep the state
 * device-scoped, transparent and isolated by user/project. Never claim this
 * counts events outside the loaded history or across other devices. */
export function MentorActivitySinceLastVisit({userId,projectId,events}:{
  userId:string;projectId:string;
  events:readonly {id:string;occurredAt:string}[];
}){
  const key="42lms:mentor:activity-seen:v1:"+userId+":"+projectId;
  const [seen,setSeen]=useState<string|null|undefined>(undefined);
  const [available,setAvailable]=useState(true);
  useEffect(()=>{
    try{
      const old=localStorage.getItem(key);
      if(old&&Number.isFinite(Date.parse(old))){
        setSeen(old);
      }else{
        const initial=new Date().toISOString();
        localStorage.setItem(key,initial);
        setSeen(initial);
      }
    }catch{
      setAvailable(false);setSeen(null);
    }
  },[key]);
  if(seen===undefined)return null;
  const newEvents=seen?events.filter(event=>
    Number.isFinite(Date.parse(event.occurredAt))&&
    Date.parse(event.occurredAt)>Date.parse(seen)).length:0;
  function markSeen(){
    const value=new Date().toISOString();
    try{localStorage.setItem(key,value);setSeen(value);}
    catch{setAvailable(false);}
  }
  return <div className="prototype-mentor-activity-since-seen" role="status">
    {available?<p><strong>{newEvents} new</strong> in the loaded activity since you last
      marked it read on this device
      {seen?" · "+new Intl.DateTimeFormat("en-IN",{
        day:"numeric",month:"short",hour:"numeric",minute:"2-digit",
        timeZone:"Asia/Kolkata",
      }).format(new Date(seen)):""}
    </p>:<p>Read tracking is unavailable in this browser. The complete activity feed remains below.</p>}
    {available&&newEvents>0?<Button size="sm" variant="secondary"
      type="button" onClick={markSeen}>Mark these as seen</Button>:null}
  </div>;
}
