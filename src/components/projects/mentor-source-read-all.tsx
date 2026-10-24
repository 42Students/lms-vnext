"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";

type Outcome={markedRead:number;remainingLoaded:number;notice:string};
export function MentorSourceReadAll({unread}:{unread:number}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [feedback,setFeedback]=useState("");
 async function run(){
  if(busy||unread===0)return;
  if(!window.confirm(
    "Mark up to 50 currently visible project and college alerts as read? This does not affect personal messages or older notices outside the loaded window."
  ))return;
  setBusy(true);setError("");setFeedback("");
  try{
   const result=await apiFetch<Outcome>(
     "/api/mentor/notifications/source-read-all",
     {method:"POST",timeoutMs:25000});
   setFeedback(result.markedRead+" source alerts marked read"+
     (result.remainingLoaded>0?
       "; "+result.remainingLoaded+" more loaded items still need review.":"."));
   router.refresh();
  }catch(caught){setError(caught instanceof Error?
    caught.message:"Source notifications could not be updated.");}
  finally{setBusy(false);}
 }
 return <div role="group" aria-label="Project and college read state"
   className="flex flex-wrap items-center gap-3">
   <span className="text-sm">{unread} unread in loaded project and college sources</span>
   <Button type="button" variant="secondary" size="sm" loading={busy}
     disabled={!unread||busy} onClick={()=>void run()}>
     Mark visible source alerts read
   </Button>
   {feedback?<span role="status" className="text-xs">{feedback}</span>:null}
   {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </div>;
}
