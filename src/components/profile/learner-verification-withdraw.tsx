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
   className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle disabled:opacity-50 sm:min-h-9">
   Withdraw
  </button>:<div role="group" aria-label="Withdraw" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
   <p className="text-sm text-body">Withdraw</p>
   <div className="mt-3 flex flex-wrap gap-3">
    <button type="button" disabled={pending||stale} onClick={withdraw}
     className="min-h-11 rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] hover:bg-primary-hover disabled:opacity-50 sm:min-h-9">
     Withdraw
    </button>
    <button type="button" disabled={pending} onClick={()=>setConfirm(false)}
     className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle disabled:opacity-50 sm:min-h-9">
     Cancel
    </button>
   </div>
  </div>}
  {message?<p role="alert" className="text-sm text-body">{message}</p>:null}
  {stale?<button type="button" onClick={()=>router.refresh()}
   className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
   Refresh verification status
  </button>:null}
 </div>;
}
