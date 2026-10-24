"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";

/** The recipient-specific high-water marker and total come from PostgreSQL.
 * The client never stores a parallel localStorage cursor or guesses from
 * the first page of events. New events after marking remain unread.
 */
export function MentorActivitySinceLastVisit({projectId,lastSeenAt,newCount}:{
 projectId:string;lastSeenAt:string|null;newCount:number|null;
}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function markSeen(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   await apiFetch("/api/projects/"+encodeURIComponent(projectId)+
     "/activity/seen",{method:"POST",cache:"no-store",timeoutMs:12000});
   router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:
     "Couldn't save the activity marker. Retry.");
  }finally{setBusy(false);}
 }
 return <section className="prototype-mentor-activity-since-seen"
   aria-label="Project activity since last review">
  {lastSeenAt!==null&&newCount!==null?
   <p role="status"><strong>{newCount} new</strong> recorded project events
     since you last marked this project seen
     {" · "}{new Intl.DateTimeFormat("en-IN",{
       day:"numeric",month:"short",hour:"numeric",minute:"2-digit",
       timeZone:"Asia/Kolkata",
     }).format(new Date(lastSeenAt))} IST.
     This is the full authorized project event count, not just loaded rows.</p>:
   <p role="status">No saved activity review marker yet.
     Mark the current project history seen to begin cross-device tracking.</p>}
  <Button type="button" variant="secondary" size="sm"
    disabled={busy} loading={busy} onClick={()=>void markSeen()}>
    {lastSeenAt?"Mark activity seen again":"Start activity tracking"}
  </Button>
  {error?<p role="alert">{error}</p>:null}
 </section>;
}
