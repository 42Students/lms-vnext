"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
export function VerificationExportControl({query,url="/api/college/verification/export",filename="college-profile-verification.csv"}:{query:Record<string,string>;url?:string;filename?:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function download(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   const resource=url+"?"+new URLSearchParams(query).toString();
   const response=await fetch(resource,{cache:"no-store"});
   if(!response.ok){
    const detail=await response.json().catch(()=>({error:"EXPORT_UNAVAILABLE"})) as {error?:string};
    throw Error(detail.error??"EXPORT_UNAVAILABLE");
   }
   const blob=await response.blob(),objectUrl=URL.createObjectURL(blob);
   try{
    const a=document.createElement("a");
    a.href=objectUrl;a.download=filename;
    document.body.appendChild(a);a.click();a.remove();
   }finally{URL.revokeObjectURL(objectUrl);}
  }catch(e){setError(e instanceof Error?e.message:"Export unavailable");}
  finally{setBusy(false);}
 }
 return <div className="space-y-1">
  <Button variant="secondary" type="button" onClick={()=>void download()} disabled={busy} className="min-h-11 sm:min-h-9">{busy?"Preparing CSV…":error?"Retry export":"Export CSV"}</Button>
  {error&&<p role="alert" className="max-w-72 break-words text-xs">CSV failed: {error}</p>}
 </div>;
}
