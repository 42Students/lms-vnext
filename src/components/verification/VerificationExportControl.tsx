"use client";
import {useState} from "react";
export function VerificationExportControl({query}:{query:Record<string,string>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function download(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   const url="/api/college/verification/export?"+new URLSearchParams(query).toString();
   const response=await fetch(url,{cache:"no-store"});
   if(!response.ok){
    const detail=await response.json().catch(()=>({error:"EXPORT_UNAVAILABLE"})) as {error?:string};
    throw Error(detail.error??"EXPORT_UNAVAILABLE");
   }
   const blob=await response.blob(),objectUrl=URL.createObjectURL(blob);
   try{
    const a=document.createElement("a");
    a.href=objectUrl;a.download="college-profile-verification.csv";
    document.body.appendChild(a);a.click();a.remove();
   }finally{URL.revokeObjectURL(objectUrl);}
  }catch(e){setError(e instanceof Error?e.message:"Export unavailable");}
  finally{setBusy(false);}
 }
 return <div className="space-y-1">
  <button type="button" onClick={()=>void download()} disabled={busy} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">{busy?"Preparing CSV…":error?"Retry export":"Export CSV"}</button>
  {error&&<p role="alert" className="max-w-72 break-words text-xs">CSV failed: {error}</p>}
 </div>;
}
