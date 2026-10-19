"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {createHrBellMutationGate} from "@/modules/placements/hr-recruiter-bell-model";
import {hrNotificationReadError} from "@/modules/placements/hr-notification-read-feedback-model";
import {isVerifiedRecruiterDecisionReadReceipt} from "@/modules/placements/recruiter-decision-read-model";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
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
    method:"POST",credentials:"same-origin",redirect:"error",
    headers:{"content-type":"application/json",Accept:"application/json"},
    body:JSON.stringify({expectedCreatedAt}),
   });
   if(res.ok){
    const payload:unknown=await res.json().catch(()=>null);
    if(!isVerifiedRecruiterDecisionReadReceipt(payload,notificationId)){
     setMessage("Could not confirm read status. Refresh this page before retrying.");
     return;
    }
    completeRef.current=true;setComplete(true);router.refresh();return;
   }
   setMessage(hrNotificationReadError(res.status));
  }catch{setMessage("Network error. Try again.");}
  finally{gate.current.end();setSaving(false);}
 }
 return <div className="mt-3 flex flex-wrap items-center gap-2">
  <Button type="button" variant="secondary" className="min-h-11" disabled={saving||complete} loading={saving} onClick={()=>void markRead()}>
   {complete?"Marked as read":saving?"Saving…":"Mark as read"}
  </Button>
  {message?<span role="status" className="text-xs text-body">{message}</span>:null}
 </div>;
}
