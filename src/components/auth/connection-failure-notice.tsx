"use client";
import {useEffect,useRef,useState} from "react";
import {InlineNotice} from "@/components/ui/inline-notice";
import type {PublicNetworkNotice} from "@/modules/auth/public-network-notice-model";
/** PUB-auth-public-31: global network error status; never clears a saved draft/session. */
export function ConnectionFailureNotice(){
 const [message,setMessage]=useState<PublicNetworkNotice|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const show=(event:Event)=>{
   const detail=(event as CustomEvent<PublicNetworkNotice>).detail;
   if(!["Request timed out","Connection problem","Server Error","Your session has not been cleared."].includes(detail))return;
   if(timer.current)clearTimeout(timer.current);
   setMessage(detail);
   timer.current=setTimeout(()=>setMessage(null),10000);
  };
  window.addEventListener("lms:network-notice",show);
  return ()=>{window.removeEventListener("lms:network-notice",show);
   if(timer.current)clearTimeout(timer.current);};
 },[]);
 return message?<div role="status" aria-live="polite" className="mx-4 my-2">
  <InlineNotice tone="error" message={message} onDismiss={()=>setMessage(null)}/>
 </div>:null;
}
