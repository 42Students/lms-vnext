"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {useRouter} from "next/navigation";
import { Button } from "@/components/ui/button";
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
  {!confirm?<Button type="button" onClick={()=>setConfirm(true)}
   variant="secondary" className="min-h-11 sm:min-h-9">
   Withdraw
  </Button>:<div role="group" aria-label="Withdraw" className="rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface-subtle p-3">
   <p className="text-sm text-body">Withdraw</p>
   <div className="mt-3 flex flex-wrap gap-3">
    <Button type="button" disabled={pending||stale} onClick={withdraw}
     variant="danger" className="min-h-11 sm:min-h-9">
     Withdraw
    </Button>
    <Button type="button" disabled={pending} onClick={()=>setConfirm(false)}
     variant="secondary" className="min-h-11 sm:min-h-9">
     Cancel
    </Button>
   </div>
  </div>}
  {message?<p role="alert" className="text-sm text-body">{message}</p>:null}
  {stale?<Button type="button" onClick={()=>router.refresh()}
   variant="secondary" className="min-h-11 sm:min-h-9">
   Refresh verification status
  </Button>:null}
 </div>;
}
