"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";

/** REC-home-drives-12/22: cancel an unpublished, recruiter-owned request.
 * The optimistic updatedAt token and membership guard are enforced by the API. */
export function RecruiterRequestCancelButton({requestId,collegeId,updatedAt}:{
 requestId:string;collegeId:string;updatedAt:string;
}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const lock=useRef(false);
 async function cancel(){
  if(lock.current || !window.confirm("Cancel this drive request? The placement cell will no longer review it."))return;
  lock.current=true;setBusy(true);setNotice(null);
  try{
   const response=await fetch("/api/placements/recruiter/drives/requests",{
    method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({requestId,collegeId,action:"CANCEL",expectedUpdatedAt:updatedAt}),
   });
   if(response.ok){router.refresh();setNotice("Request cancelled.");return;}
   const body:unknown=await response.json().catch(()=>null);
   const code=body&&typeof body==="object"&&"error" in body?String(body.error):"";
   setNotice(code==="STALE"||code==="INVALID_STATE"?
    "This request has changed. Refresh Drives before trying again.":
    code==="FORBIDDEN"?"Your access to this college has ended.":
    "Could not cancel the request. Please try again.");
  }catch{setNotice("Could not cancel the request. Please try again.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <div className="mt-2">
  <button type="button" disabled={busy} onClick={()=>void cancel()}
   className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-primary-text disabled:opacity-50">
   {busy?"Cancelling…":"Cancel request"}
  </button>
  {notice?<p role="status" className="mt-2 text-xs text-body">{notice}</p>:null}
 </div>;
}
