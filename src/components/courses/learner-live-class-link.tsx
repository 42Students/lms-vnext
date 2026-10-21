"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { StatusBadge } from "@/components/ui/status-badge";

function meetingProvider(href:string){
 try{
  if(href!==href.trim()||/[\\\\\x00-\x1f\x7f]/.test(href))return null;
  const url=new URL(href);
  if(url.protocol!=="https:"||url.username||url.password)return null;
  const host=url.hostname.toLowerCase();
  if(host==="zoom.us"||host.endsWith(".zoom.us"))return "Zoom";
  if(host==="meet.google.com")return "Google Meet";
  if(host==="teams.microsoft.com"||host==="teams.live.com")return "Microsoft Teams";
  if(host==="webex.com"||host.endsWith(".webex.com"))return "Webex";
  if(host==="whereby.com"||host.endsWith(".whereby.com"))return "Whereby";
  return host;
 }catch{return null;}
}
function MeetingVideoIcon(){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>;
}
function CopyLinkIcon(){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>;
}

/** Ended sessions disable learner actions; unknown/malformed time is not
 * evidence that a session ended or is live. Keep the authorized meeting link
 * reachable as the legacy card did for missing schedule fields. */
export function LearnerLiveClassLink({href,endsAt}:{href:string;endsAt?:string|null}){
 const [message,setMessage]=useState("");
 const [ended,setEnded]=useState(false);
 const noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const timeUnknown=Boolean(endsAt&&!Number.isFinite(Date.parse(endsAt)));
 const provider=meetingProvider(href);
 useEffect(()=>{
  if(!endsAt||!Number.isFinite(Date.parse(endsAt))){
   const reset=window.setTimeout(()=>setEnded(false),0);
   return ()=>window.clearTimeout(reset);
  }
  const end=Date.parse(endsAt);
  // Legacy isBefore(now) keeps the join available at the exact end instant.
  const refresh=()=>setEnded(Date.now()>end);
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
 if(ended)return <div role="status" className="mt-3 space-y-2">
  <Button type="button" disabled variant="secondary" className="inline-flex min-h-11 items-center gap-2 md:min-h-9">
    <MeetingVideoIcon/> Session ended
  </Button>
  <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
    <StatusBadge tone="neutral">Ended</StatusBadge> This session has already ended.
  </p>
 </div>;
 return <div className="mt-3 min-w-0 space-y-3">
  <p className="text-sm leading-[22px] text-body">
    Join using the meeting link below. Keep it handy before the class starts.
    {provider?" This session is on "+provider+".":""}
  </p>
  <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-start">
   {timeUnknown?<span role="status" className="text-xs text-muted-foreground">
    <StatusBadge tone="warning">Time unavailable</StatusBadge> Verify the session schedule with your instructor.
   </span>:null}
   <span className="min-w-0 sm:order-2">
    <Button type="button" variant="secondary" onClick={()=>void copy()}
      aria-label="Copy meeting link" title="Copy meeting link"
      className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 md:min-h-9 md:min-w-9">
      <CopyLinkIcon/>
    </Button>
   </span>
   <span className="min-w-0 sm:order-3 [&_a:first-child]:!border-[var(--lms-button-primary)] [&_a:first-child]:!bg-[var(--lms-button-primary)] [&_a:first-child]:!text-[var(--lms-on-primary)] [&_a:first-child]:!no-underline [&_a:first-child]:hover:!bg-[var(--lms-button-primary-hover)] [&_a:first-child]:min-h-11">
    <ThirdPartyLink href={href} label="Join Meeting"/>
   </span>
  </div>
  {message?<p role="status" aria-live="polite" className="text-xs text-muted-foreground">{message}</p>:null}
 </div>;
}
