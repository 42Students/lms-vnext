"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";

export function TpoPlacementCellReadAction({id}:{id:string}){
 const router=useRouter();
 const pending=useRef(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function markRead(){
  if(pending.current)return;
  pending.current=true;setBusy(true);setNotice("");setError("");
  const controller=new AbortController();
  const timer=window.setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetch("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/read-cell",{
    method:"POST",headers:{"content-type":"application/json"},body:"{}",signal:controller.signal,
   });
   if(!response.ok)throw new Error(response.status===409?
    "This announcement changed. Refresh and try again.":
    response.status===403?"You do not have permission to mark this announcement read.":
    response.status===404?"This announcement is no longer available.":
    "Could not save this read receipt. Please try again.");
   const data=await response.json().catch(()=>null) as {firstInCollege?:boolean}|null;
   setNotice(data?.firstInCollege?
    "Marked as read for this placement cell.":
    "Already read by someone in this placement cell.");
   router.refresh();
  }catch{
   setError("We could not save this read receipt. Please try again.");
  }finally{
   window.clearTimeout(timer);pending.current=false;setBusy(false);
  }
 }
 return <div className="mt-3 space-y-1">
  <button type="button" disabled={busy} onClick={()=>void markRead()}
   className="min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Saving…":"Mark as read for our placement cell"}
  </button>
  {error?<p role="alert" className="text-xs text-danger">{error}</p>:null}
  {notice?<p role="status" className="text-xs text-body">{notice}</p>:null}
 </div>;
}
