"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import type {VerificationSection} from "@/modules/profile-verification/domain";

export function LearnerVerificationWithdraw({
 section,expectedVersion,
}:{section:VerificationSection;expectedVersion:number}){
 const [confirm,setConfirm]=useState(false);
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState<string|null>(null);
 const [stale,setStale]=useState(false);
 const router=useRouter();
 async function withdraw(){
  if(!confirm||pending||stale)return;
  setPending(true);setMessage(null);
  try{
   const response=await fetch("/api/profile-verification/self/withdraw",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section,expectedVersion}),
   });
   if(response.ok){
    setConfirm(false);
    router.refresh();
   }else{
    const result=await response.json().catch(()=>null) as {error?:string}|null;
    const versionConflict=response.status===409||result?.error==="STALE_VERSION";
    setStale(versionConflict);
    setMessage(versionConflict?"Refresh verification status":"Could not withdraw");
   }
  }catch{
   setMessage("Could not withdraw");
  }finally{
   setPending(false);
  }
 }
 return <div className="mt-3 space-y-2">
  {!confirm?<button type="button" onClick={()=>setConfirm(true)}
   className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
   Withdraw
  </button>:<div role="group" aria-label="Withdraw" className="rounded-lg border border-border p-3">
   <p className="text-sm text-body">Withdraw</p>
   <div className="mt-3 flex flex-wrap gap-3">
    <button type="button" disabled={pending||stale} onClick={withdraw}
     className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
     Withdraw
    </button>
    <button type="button" disabled={pending} onClick={()=>setConfirm(false)}
     className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
     Cancel
    </button>
   </div>
  </div>}
  {message?<p role="alert" className="text-sm text-body">{message}</p>:null}
  {stale?<button type="button" onClick={()=>router.refresh()}
   className="min-h-11 rounded-md border px-3 text-sm font-semibold text-primary-text">
   Refresh verification status
  </button>:null}
 </div>;
}
