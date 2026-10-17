"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function CollegeInterviewStatusActions({id,version,status}:{
 id:string;version:number;status:string;
}){
 const router=useRouter(),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function update(next:"COMPLETED"|"NO_SHOW"){
  if(busy||status!=="SCHEDULED"||!window.confirm("Mark this interview as "+(next==="NO_SHOW"?"No Show":"Completed")+"?"))return;
  const reason=window.prompt("Reason for interview "+next.toLowerCase().replaceAll("_"," ")+":");
  if(!reason||reason.trim().length<3)return;
  setBusy(true);setMessage("");
  try{
   const res=await fetch("/api/college/placements/interviews/"+encodeURIComponent(id)+"/status",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status:next,expectedVersion:version,reason:reason.trim()}),
   });
   if(!res.ok)throw Error(res.status===409?"Interview changed. Refresh before retrying.":"Unable to update interview status.");
   setMessage(next==="NO_SHOW"?"Marked No Show.":"Marked Completed.");
   router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Update failed.");}
  finally{setBusy(false);}
 }
 if(status!=="SCHEDULED")return <span className="text-xs text-muted-foreground">No status action</span>;
 return <div className="flex flex-wrap gap-2">
  <button type="button" disabled={busy} onClick={()=>void update("COMPLETED")}
   className="min-h-10 rounded border border-border px-3 text-xs text-primary-text disabled:opacity-50">
   Mark as Completed
  </button>
  <button type="button" disabled={busy} onClick={()=>void update("NO_SHOW")}
   className="min-h-10 rounded border border-border px-3 text-xs text-primary-text disabled:opacity-50">
   No Show
  </button>
  {message?<p role="status" className="text-xs">{message}</p>:null}
 </div>;
}
