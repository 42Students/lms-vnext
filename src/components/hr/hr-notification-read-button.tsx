"use client";
import {useRef,useState} from "react";
import {createHrBellMutationGate} from "@/modules/placements/hr-recruiter-bell-model";
import {hrNotificationReadError} from "@/modules/placements/hr-notification-read-feedback-model";
import {useRouter} from "next/navigation";
export function HrNotificationReadButton({notificationId,expectedCreatedAt}:{
 notificationId:string;expectedCreatedAt:string;
}){
 const router=useRouter();
 const [saving,setSaving]=useState(false);
 const [complete,setComplete]=useState(false);
 const completeRef=useRef(false);
 const gate=useRef(createHrBellMutationGate());
 const [message,setMessage]=useState("");
 async function markRead(){
  if(completeRef.current || !gate.current.tryBegin())return;
  setSaving(true);setMessage("");
  try{
   const res=await fetch("/api/placements/recruiter/notifications/"+
    encodeURIComponent(notificationId)+"/read",{
    method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({expectedCreatedAt}),
   });
   if(res.ok){completeRef.current=true;setComplete(true);router.refresh();return;}
   setMessage(hrNotificationReadError(res.status));
  }catch{setMessage("Network error. Try again.");}
  finally{gate.current.end();setSaving(false);}
 }
 return <div className="mt-3 flex flex-wrap items-center gap-2">
  <button type="button" disabled={saving||complete} onClick={()=>void markRead()}
   className="min-h-11 rounded-md border border-border px-3 text-sm text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:opacity-60">
   {complete?"Marked as read":saving?"Saving…":"Mark as read"}
  </button>
  {message?<span role="status" className="text-xs text-body">{message}</span>:null}
 </div>;
}
