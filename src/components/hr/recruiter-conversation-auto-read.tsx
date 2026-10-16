"use client";
import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";
import {recruiterConversationAcknowledged} from "@/modules/placements/recruiter-conversation-auto-read-model";

/** A thread read remains a POST; no server GET has a hidden mutation. */
export function RecruiterConversationAutoRead({threadId}:{threadId:string}){
 const router=useRouter();
 const attempted=useRef(false);
 useEffect(()=>{
  if(attempted.current)return;
  attempted.current=true;
  let active=true;
  void fetch("/api/placements/recruiter/conversations/"+encodeURIComponent(threadId)+"/acknowledge",{
   method:"POST",credentials:"same-origin",
  }).then(response=>{
   if(!active)return;
   const redirectPath=new URL(response.url).pathname;
   if(recruiterConversationAcknowledged({
    status:response.status,redirected:response.redirected,redirectPath,threadId,
   }))router.refresh();
   // Failure leaves the explicit manual acknowledgement control available.
  }).catch(()=>{/* Read not confirmed: manual action remains available. */});
  return()=>{active=false;};
 },[threadId,router]);
 return null;
}
