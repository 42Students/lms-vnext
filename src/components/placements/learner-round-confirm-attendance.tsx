"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
export function LearnerRoundConfirmAttendance({applicationId,roundId,confirmed}:{
 applicationId:string;roundId:string;confirmed:boolean;
}){
 const router=useRouter();
 const [isConfirmed,setConfirmed]=useState(confirmed);
 const [error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 if(isConfirmed)return <span role="status" className="text-xs font-semibold">Confirmed</span>;
 return <div className="flex flex-wrap items-center gap-2">
  <span className="text-xs font-semibold text-warning">Please confirm</span>
  <button type="button" disabled={pending} onClick={()=>void run(async()=>{
   setError("");
   try{
    await apiFetch("/api/placements/learner/rounds/confirm",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({applicationId,roundId,confirmed:true}),
    });
    setConfirmed(true);router.refresh();
   }catch{setError("Attendance confirmation could not be saved. Try again.");}
  })} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle disabled:opacity-50 sm:min-h-9">
   {pending?"Confirming…":"Confirm I'll attend"}
  </button>
  {error?<p role="alert" className="w-full text-xs text-error">{error}</p>:null}
 </div>;
}
