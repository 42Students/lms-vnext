"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function TpoPlacementCellReadAction({id}:{id:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[notice,setNotice]=useState<string|null>(null);
 async function markRead(){
  if(busy)return;setBusy(true);setNotice(null);
  try{
   const response=await fetch("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/read-cell",{
    method:"POST",headers:{"content-type":"application/json"},body:"{}",
   });
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(body?.error??"Read receipt could not be recorded.");
   setNotice(body?.firstInCollege?"Marked as read for this placement cell.":"Already read by someone in this placement cell.");
   router.refresh();
  }catch(e){setNotice(e instanceof Error?e.message:"Read receipt could not be saved.");}
  finally{setBusy(false);}
 }
 return <div className="mt-3 space-y-1">
  <button type="button" disabled={busy} onClick={()=>void markRead()}
    className="min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
    {busy?"Saving…":"Mark as read for our placement cell"}
  </button>
  {notice?<p role="status" className="text-xs text-body">{notice}</p>:null}
 </div>;
}
