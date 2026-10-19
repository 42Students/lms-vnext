"use client";
import { Button } from "@/components/ui/button";
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
  {!confirm?<Button variant="primary" type="button" onClick={()=>setConfirm(true)}
   className="text-primary-text">
   Withdraw
  </Button>:<div role="group" aria-label="Withdraw" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
   <p className="text-sm text-body">Withdraw</p>
   <div className="mt-3 flex flex-wrap gap-3">
    <Button variant="primary" type="button" disabled={pending||stale} onClick={withdraw}
     >
     Withdraw
    </Button>
    <Button variant="primary" type="button" disabled={pending} onClick={()=>setConfirm(false)}
     className="text-primary-text">
     Cancel
    </Button>
   </div>
  </div>}
  {message?<p role="alert" className="text-sm text-body">{message}</p>:null}
  {stale?<Button variant="primary" type="button" onClick={()=>router.refresh()}
   className="text-primary-text">
   Refresh verification status
  </Button>:null}
 </div>;
}
