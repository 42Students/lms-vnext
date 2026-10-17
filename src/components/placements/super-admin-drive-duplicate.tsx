"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function SuperAdminDriveDuplicate({jobId,title}:{jobId:string;title:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function duplicate(){
  if(busy||!window.confirm('Duplicate "'+title+'" as a new drive? Dates, applications, interview rounds, offers, and candidate decisions will not be copied.'))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/placements/jobs/"+encodeURIComponent(jobId)+"/duplicate",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirmed:true}),
   });
   const result=await response.json().catch(()=>null);
   if(!response.ok||!result?.jobId)throw new Error(result?.error??"Could not duplicate drive.");
   router.push("/admin/placements/jobs/"+encodeURIComponent(result.jobId));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not duplicate drive.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-2">
  <button type="button" onClick={()=>void duplicate()} disabled={busy}
   className="min-h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Creating draft…":"Duplicate as new drive"}</button>
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
