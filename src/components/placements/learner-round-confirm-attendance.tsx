"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";
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
  <Button type="button" disabled={pending} onClick={()=>void run(async()=>{
   setError("");
   try{
    await apiFetch("/api/placements/learner/rounds/confirm",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({applicationId,roundId,confirmed:true}),
    });
    setConfirmed(true);router.refresh();
   }catch{setError("Attendance confirmation could not be saved. Try again.");}
  })} >
   {pending?"Confirming…":"Confirm I'll attend"}
  </Button>
  {error?<p role="alert" className="w-full text-xs text-error">{error}</p>:null}
 </div>;
}
