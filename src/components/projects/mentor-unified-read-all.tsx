"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
 const [confirmOpen,setConfirmOpen]=useState(false);
 const router=useRouter();
 async function markAll(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   const result=await apiFetch<Outcome>(
     "/api/mentor/notifications/unified-read-all",
     {method:"POST",timeoutMs:25000});
   if(!result.completeForCurrentVisibleSources)
     throw Error("The server did not confirm all visible sources were acknowledged.");
   setConfirmOpen(false);
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
      onClick={()=>setConfirmOpen(true)}>
      Mark all read
   </Button>
   <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
     title="Mark all Mentor notifications read?"
     description="This acknowledges your current personal, project-attention and visible college notifications. New events and revised tasks may appear unread again."
     confirmLabel="Mark all read" confirmVariant="primary" pending={busy}
     onConfirm={()=>void markAll()}/>
   {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
