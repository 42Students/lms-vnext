"use client";
import { Button } from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import {hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
import {isVerifiedRecruiterThreadAcknowledgement} from "@/modules/placements/recruiter-thread-ack-receipt-model";
/** Acknowledgement's on-open guard belongs to ONE thread, not its router slot. */
export function RecruiterConversationReadControl({threadId}:{threadId:string}){
 return <RecruiterConversationReadControlState key={threadId} threadId={threadId}/>;
}
function RecruiterConversationReadControlState({threadId}:{threadId:string}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const acknowledgePending=useRef(false);
 const [notice,setNotice]=useState("");
 const acknowledgedOnOpen=useRef(false);
 useEffect(()=>{
  if(acknowledgedOnOpen.current)return;
  acknowledgedOnOpen.current=true;
  acknowledgePending.current=true;
  // GET remains read-only. POST must confirm the persisted thread receipt.
  let active=true;
  const controller=new AbortController();
  void fetch("/api/placements/recruiter/conversations/"+encodeURIComponent(threadId)+"/acknowledge",{
    method:"POST",credentials:"same-origin",redirect:"error",
    headers:{Accept:"application/json"},signal:controller.signal,
  }).then(async response=>{
    const payload:unknown=response.ok?await response.json().catch(()=>null):null;
    if(!active)return;
    if(response.ok&&!response.redirected&&
     isVerifiedRecruiterThreadAcknowledgement(payload,threadId))router.refresh();
    else setNotice("Read status could not be saved. Use the button below to retry.");
  }).catch(()=>{if(active)setNotice("Read status could not be saved. Use the button below to retry.");})
   .finally(()=>{acknowledgePending.current=false;});
  return ()=>{active=false;controller.abort();};
 },[threadId,router]);
 async function acknowledge(){
  if(acknowledgePending.current)return;
  acknowledgePending.current=true;
  setBusy(true);
  setNotice("");
  let success=false;
  let feedback="Could not confirm that these messages were marked read.";
  try{
   const response=await fetch("/api/placements/recruiter/conversations/"+encodeURIComponent(threadId)+"/acknowledge",{
    method:"POST",credentials:"same-origin",redirect:"error",
    headers:{Accept:"application/json"},
   });
   const payload:unknown=response.ok?await response.json().catch(()=>null):null;
   success=response.ok&&!response.redirected&&
    isVerifiedRecruiterThreadAcknowledgement(payload,threadId);
   if(!success)feedback=hrReplyErrorMessage(response.status);
  }catch{feedback="Connection unavailable. Read status has not been confirmed.";}
  try{
   if(success){setNotice("Read status updated.");router.refresh();}
   else setNotice(feedback);
  }finally{acknowledgePending.current=false;setBusy(false);}
 }
 return <div className="space-y-2">
  <Button type="button" variant="secondary" className="min-h-11" disabled={busy} loading={busy} onClick={acknowledge}>
   {busy?"Updating…":"Mark placement cell messages as read"}
  </Button>
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </div>;
}
