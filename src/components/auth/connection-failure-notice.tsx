"use client";
import {useEffect,useRef,useState} from "react";
import {InlineNotice} from "@/components/ui/inline-notice";
import type {PublicNetworkNotice} from "@/modules/auth/public-network-notice-model";
/** PUB-auth-public-31: global network error status; never clears a saved draft/session. */
export function ConnectionFailureNotice(){
 const [message,setMessage]=useState<PublicNetworkNotice|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const lastMessage=useRef<PublicNetworkNotice|null>(null);
 useEffect(()=>{
  function schedule() {
   if(timer.current)clearTimeout(timer.current);
   timer.current=null;
   // A notice triggered in a background tab must still be readable on return.
   if(!document.hidden&&lastMessage.current) timer.current=setTimeout(()=>{
    lastMessage.current=null;setMessage(null);timer.current=null;
   },5000);
  }
  const show=(event:Event)=>{
   const detail=(event as CustomEvent<PublicNetworkNotice>).detail;
   if(!["Request timed out","Connection problem","Server Error","Your session has not been cleared."].includes(detail))return;
   lastMessage.current=detail;
   setMessage(detail);
   schedule();
  };
  window.addEventListener("lms:network-notice",show);
  document.addEventListener("visibilitychange",schedule);
  return ()=>{window.removeEventListener("lms:network-notice",show);
   document.removeEventListener("visibilitychange",schedule);
   if(timer.current)clearTimeout(timer.current);};
 },[]);
 return message?<div className="my-[var(--lms-space-3)] w-full min-w-0">
  <InlineNotice tone="error" message={message} onDismiss={()=>{lastMessage.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;setMessage(null);}}/>
 </div>:null;
}
