"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
import { ThirdPartyLink } from "@/components/ui/third-party-link";

/**
 * LEARNER-course-detail-R03:
 * Join and Copy are enabled before a scheduled session starts, but become
 * unavailable once the authored session ends, including while this page stays
 * open without a router refresh.
 */
export function LearnerLiveClassLink({href,endsAt}:{href:string;endsAt?:string|null}){
 const [message,setMessage]=useState("");
 const [ended,setEnded]=useState(false);
 useEffect(()=>{
  if(!endsAt)return;
  const end=Date.parse(endsAt);
  if(!Number.isFinite(end))return;
  const refresh=()=>setEnded(Date.now()>=end);
  const initial=window.setTimeout(refresh,0);
  const timer=window.setInterval(refresh,15000);
  return ()=>{window.clearTimeout(initial);window.clearInterval(timer);};
 },[endsAt]);
 async function copy(){
  if(ended)return;
  try{await navigator.clipboard.writeText(href);setMessage("Meeting link copied.");}
  catch{setMessage("Could not copy the meeting link. Open the meeting instead.");}
 }
 if(ended)return <p role="status" className="mt-3 text-sm text-muted-foreground">
  This live session has ended. Join Meeting and Copy meeting link are no longer available.
 </p>;
 return <div className="mt-3 flex flex-wrap items-center gap-2">
  <ThirdPartyLink href={href} label="Join Meeting" />
  <Button type="button" variant="secondary" onClick={()=>void copy()} className="min-h-11">Copy meeting link</Button>
  {message?<span role="status" className="text-xs text-muted-foreground">{message}</span>:null}
 </div>;
}
