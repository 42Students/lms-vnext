"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function TpoDriveCloneAction({jobId,label="Run it again"}:{jobId:string;label?:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function clone(){
  if(busy||!window.confirm("Run this drive again as a new draft? Dates, rounds, candidates, outcomes, batch targets and external portal links will be cleared."))return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/clone",{
    method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({confirmed:true}),
   });
   const body=await res.json() as {jobId?:string;error?:string};
   if(!res.ok||!body.jobId)throw Error(body.error??"Could not create a fresh draft");
   router.push("/tpo/placements/jobs/"+encodeURIComponent(body.jobId));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Clone failed");}finally{setBusy(false);}
 }
 return <div className="inline-flex flex-col gap-1">
  <button type="button" disabled={busy} onClick={()=>void clone()}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Creating draft…":label}
  </button>
  {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </div>;
}
