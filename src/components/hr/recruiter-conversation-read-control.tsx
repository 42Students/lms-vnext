"use client";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
export function RecruiterConversationReadControl({threadId}:{threadId:string}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const acknowledgePending=useRef(false);
 const [notice,setNotice]=useState("");
 const acknowledgedOnOpen=useRef(false);
 useEffect(()=>{
  if(acknowledgedOnOpen.current)return;
  acknowledgedOnOpen.current=true;
  acknowledgePending.current=true;
  // The GET stays read-only. An explicit client POST acknowledges when opened.
  void fetch("/api/placements/recruiter/conversations/"+encodeURIComponent(threadId)+"/acknowledge",{
    method:"POST",credentials:"same-origin",
  }).then(response=>{
    if(response.ok)router.refresh();
    else setNotice("Read status could not be saved. Use the button below to retry.");
  }).catch(()=>setNotice("Read status could not be saved. Use the button below to retry."))
   .finally(()=>{acknowledgePending.current=false;});
 },[threadId,router]);
 async function acknowledge(){
  if(acknowledgePending.current)return;
  acknowledgePending.current=true;
  setBusy(true);
  setNotice("");
  let success=false;
  let feedback="Could not confirm that these messages were marked read.";
  try{
   const response=await fetch("/api/placements/recruiter/conversations/"+threadId+"/acknowledge",{
    method:"POST",credentials:"same-origin",
   });
   success=response.redirected&&response.status===200&&
    new URL(response.url).pathname==="/hr/conversations/"+threadId;
   if(!success)feedback=hrReplyErrorMessage(response.status);
  }catch{feedback="Connection unavailable. Read status has not been confirmed.";}
  try{
   if(success){setNotice("Read status updated.");router.refresh();}
   else setNotice(feedback);
  }finally{acknowledgePending.current=false;setBusy(false);}
 }
 return <div className="space-y-2">
  <button type="button" disabled={busy} onClick={acknowledge}
   className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-60">
   {busy?"Updating…":"Mark placement cell messages as read"}
  </button>
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </div>;
}
