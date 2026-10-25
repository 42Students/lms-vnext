"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type Outcome={markedRead:number;remainingLoaded:number;notice:string};
export function MentorSourceReadAll({unread}:{unread:number}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [error,setError]=useState("");
 const [feedback,setFeedback]=useState("");
 async function run(){
  if(busy||unread===0)return;
  setConfirmOpen(false);
  setBusy(true);setError("");setFeedback("");
  try{
   const result=await apiFetch<Outcome>(
     "/api/mentor/notifications/source-read-all",
     {method:"POST",timeoutMs:25000});
   setFeedback(result.markedRead+" source alerts marked read"+
     (result.remainingLoaded>0?
       "; "+result.remainingLoaded+" more loaded items still need review.":"."));
   window.dispatchEvent(new Event("lms:notifications-updated"));
     router.refresh();
  }catch(caught){setError(caught instanceof Error?
    caught.message:"Source notifications could not be updated.");}
  finally{setBusy(false);}
 }
 return <div role="group" aria-label="Project and college read state"
   className="flex flex-wrap items-center gap-3">
   <span className="text-sm">{unread} unread in loaded project and college sources</span>
   <Button type="button" variant="secondary" size="sm" loading={busy}
     disabled={!unread||busy} onClick={()=>setConfirmOpen(true)}>
     Mark visible source alerts read
   </Button>
   <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
     title="Mark visible source alerts as read?"
     description="Up to 50 currently loaded project and college alerts will be marked read. Personal messages and older unpaginated alerts are not affected."
     confirmLabel="Mark visible alerts read" confirmVariant="primary"
     confirmDisabled={!unread} pending={busy} onConfirm={()=>void run()}/>
   {feedback?<span role="status" className="text-xs">{feedback}</span>:null}
   {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </div>;
}
