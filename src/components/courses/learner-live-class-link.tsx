"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { StatusBadge } from "@/components/ui/status-badge";

/** Ended sessions disable learner actions; unknown/malformed time is not
 * evidence that a session ended or is live. Keep the authorized meeting link
 * reachable as the legacy card did for missing schedule fields. */
export function LearnerLiveClassLink({href,endsAt}:{href:string;endsAt?:string|null}){
 const [message,setMessage]=useState("");
 const [ended,setEnded]=useState(false);
 const noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const timeUnknown=Boolean(endsAt&&!Number.isFinite(Date.parse(endsAt)));
 useEffect(()=>{
  if(!endsAt||!Number.isFinite(Date.parse(endsAt))){
   const reset=window.setTimeout(()=>setEnded(false),0);
   return ()=>window.clearTimeout(reset);
  }
  const end=Date.parse(endsAt);
  const refresh=()=>setEnded(Date.now()>=end);
  const initial=window.setTimeout(refresh,0);
  const timer=window.setInterval(refresh,15000);
  return ()=>{window.clearTimeout(initial);window.clearInterval(timer);};
 },[endsAt]);
 useEffect(()=>()=>{if(noticeTimer.current)window.clearTimeout(noticeTimer.current);},[]);
 function announce(value:string){
  if(noticeTimer.current)window.clearTimeout(noticeTimer.current);
  setMessage(value);
  noticeTimer.current=window.setTimeout(()=>setMessage(""),3000);
 }
 async function copy(){
  if(ended)return;
  try{await navigator.clipboard.writeText(href);announce("Meeting link copied");}
  catch{announce("Couldn't copy the link");}
 }
 if(ended)return <p role="status" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
  <StatusBadge tone="neutral">Ended</StatusBadge>
  This session has already ended.
 </p>;
 return <div className="mt-3 flex flex-wrap items-center gap-2">
  {timeUnknown?<span role="status" className="text-xs text-muted-foreground">
   <StatusBadge tone="warning">Time unavailable</StatusBadge> Verify the session schedule with your instructor.
  </span>:null}
  <ThirdPartyLink href={href} label="Join Meeting" />
  <Button type="button" variant="secondary" onClick={()=>void copy()} className="min-h-11 md:min-h-9">Copy meeting link</Button>
  {message?<span role="status" className="text-xs text-muted-foreground">{message}</span>:null}
 </div>;
}
