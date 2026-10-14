"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function HrNotificationReadButton({notificationId,expectedCreatedAt}:{
 notificationId:string;expectedCreatedAt:string;
}){
 const router=useRouter();
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 async function markRead(){
  if(saving)return;
  setSaving(true);setMessage("");
  try{
   const res=await fetch("/api/placements/recruiter/notifications/"+
    encodeURIComponent(notificationId)+"/read",{
    method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({expectedCreatedAt}),
   });
   if(res.ok){router.refresh();return;}
   setMessage(res.status===409?"This notification changed. Refresh the inbox.":"Unable to mark read.");
  }catch{setMessage("Network error. Try again.");}
  finally{setSaving(false);}
 }
 return <div className="mt-3 flex flex-wrap items-center gap-2">
  <button type="button" disabled={saving} onClick={()=>void markRead()}
   className="min-h-10 rounded-md border border-border px-3 text-sm text-primary-text disabled:opacity-60">
   {saving?"Saving…":"Mark as read"}
  </button>
  {message?<span role="status" className="text-xs text-body">{message}</span>:null}
 </div>;
}
