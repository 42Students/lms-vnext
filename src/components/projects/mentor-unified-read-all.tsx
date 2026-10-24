"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";

type Outcome={markedPersonal:number;markedSources:number;
  examinedSources:number;completeForCurrentVisibleSources:boolean};
/** Uses one server transaction for current recipient, not several sequential
 * browser calls that could fail halfway through a claimed global action.
 */
export function MentorUnifiedReadAll({loadedUnread,moreNoticesPossible=false}:{
 loadedUnread:number;moreNoticesPossible?:boolean;
}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const router=useRouter();
 async function markAll(){
  if(busy)return;
  if(!window.confirm("Mark all current personal, project-attention and visible college notifications as read? New events and later task revisions will appear as unread."))return;
  setBusy(true);setError("");
  try{
   const result=await apiFetch<Outcome>(
     "/api/mentor/notifications/unified-read-all",
     {method:"POST",timeoutMs:25000});
   if(!result.completeForCurrentVisibleSources)
     throw Error("The server did not confirm all visible sources were acknowledged.");
   window.dispatchEvent(new Event("lms:notifications-updated"));
   router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:
    "Could not save notification read state.");}
  finally{setBusy(false);}
 }
 return <div className="flex flex-wrap items-center gap-3"
   role="group" aria-label="All Mentor notification read actions">
   <span className="text-sm">
     {loadedUnread} unread in loaded sources
     {moreNoticesPossible?" · older college notices may also exist":""}
   </span>
   <Button type="button" variant="secondary" size="sm"
      loading={busy} disabled={busy||(!loadedUnread&&!moreNoticesPossible)}
      onClick={()=>void markAll()}>
      Mark all read
   </Button>
   {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
