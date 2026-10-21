"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
export function LearnerRoundConfirmAttendance({applicationId,roundId,confirmed}:{
 applicationId:string;roundId:string;confirmed:boolean;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [isConfirmed,setConfirmed]=useState(confirmed);
 const [error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 /** Old interview attendance confirmation maps to the membership-scoped,
  * round-linked /api/placements/learner/rounds/confirm action. Confirmation
  * is not a screening/assessment pass decision; reschedule requests are
  * handled by the distinct learner-schedule-reschedule component. */
 if(isConfirmed)return <span role="status" className="text-xs font-semibold text-success">Confirmed</span>;
 return <div className="flex flex-wrap items-center gap-2">
  <span className="text-xs font-semibold text-warning">Please confirm</span>
  <Button className="max-md:min-h-11" type="button" disabled={pending} onClick={()=>void run(async()=>{
   setError("");
   try{
    await apiFetch("/api/placements/learner/rounds/confirm",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({applicationId,roundId,confirmed:true}),
    });
    setConfirmed(true);
    showToast({tone:"success",title:"Confirmed. See you there."});
    router.refresh();
   }catch{setError("Attendance confirmation could not be saved. Try again.");}
  })} >
   {pending?"Confirming…":"Confirm I'll attend"}
  </Button>
  {error?<p role="alert" className="w-full text-xs text-error">{error}</p>:null}
 </div>;
}
