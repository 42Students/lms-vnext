"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";

/** Explicit learner receipt acknowledgement. A GET/list cannot mutate read
 * state, and the server rechecks the persisted learner/college recipient.
 */
export function LearnerNoticeReadAction({notificationId}:{notificationId:string}){
 const router=useRouter();
 const [pending,setPending]=useState(false);
 const [done,setDone]=useState(false);
 const [error,setError]=useState("");
 async function mark(){
  if(pending||done)return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/notifications/"+encodeURIComponent(notificationId)+"/read",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
   });
   if(!response.ok)throw new Error("Not saved");
   setDone(true);
   router.refresh();
  }catch{
   setError("Could not mark this announcement as read. Try again.");
  }finally{
   setPending(false);
  }
 }
 if(done)return <span role="status" className="text-xs text-muted-foreground">Marked as read</span>;
 return <div className="mt-2 flex flex-wrap items-center gap-2">
  <Button variant="secondary" type="button" size="sm" className="min-h-11 md:min-h-9"
   disabled={pending} loading={pending} onClick={()=>void mark()}>
   {pending?"Saving…":"Mark as read"}
  </Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
 </div>;
}
