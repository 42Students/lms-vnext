"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {apiFetch} from "@/lib/api-fetch";

/** GR-80 / LEARNER-placements-01: recipient-scoped acknowledgment before opening.
 * GET never writes. The POST route independently verifies membership ownership.
 */
export function LearnerPlacementAlertAction({id,href,unread}:{
 id:string;href:string|null;unread:boolean;
}){
 const router=useRouter();
 const [isUnread,setIsUnread]=useState(unread);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const safeHref=href?.startsWith("/")&&!href.startsWith("//")?href:null;
 async function markRead():Promise<boolean>{
  if(!isUnread)return true;
  if(pending)return false;
  setPending(true);setError(null);
  try{
   await apiFetch("/api/notifications/"+encodeURIComponent(id)+"/read",{
    method:"POST",headers:{"content-type":"application/json"},body:"{}",
   });
   setIsUnread(false);
   router.refresh();
   return true;
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Could not mark this alert as read. Please try again.");
   return false;
  }finally{setPending(false);}
 }
 async function open(){
  if(await markRead() && safeHref)router.push(safeHref);
 }
 return <div className="mt-2 flex flex-wrap items-center gap-3">
  {isUnread?<span role="status" className="text-xs font-semibold text-primary-text">(Unread)</span>:null}
  {safeHref?<Link href={safeHref} aria-disabled={pending}
     onClick={event=>{if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
       event.preventDefault();void open();}}
     className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
     {pending?"Marking as read…":"Open related page →"}
   </Link>:isUnread?<button type="button" onClick={()=>void markRead()} disabled={pending}
      className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
      {pending?"Marking as read…":"Mark as read"}
   </button>:null}
  {error?<p role="alert" className="w-full text-xs font-semibold text-error">{error}</p>:null}
 </div>;
}
