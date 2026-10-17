"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function CollegeDriveDuplicateAction({jobId}:{jobId:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function duplicate(){
  if(busy||!window.confirm("Duplicate as new drive? Candidates, results, past deadlines, audience overrides, offers and external links will not be copied."))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/duplicate",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({confirmed:true}),
   });
   const body=await response.json().catch(()=>null);
   if(!response.ok||!body?.jobId)throw Error(body?.error??"Could not duplicate the drive.");
   router.push("/college/placements/jobs/"+encodeURIComponent(body.jobId)+"/settings");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not duplicate the drive.");}
  finally{setBusy(false);}
 }
 return <div className="inline-flex flex-col gap-1">
  <button type="button" disabled={busy} onClick={()=>void duplicate()}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Creating draft…":"Duplicate as new drive"}</button>
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
