"use client";
import { Button } from "@/components/ui/button";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {hallCancellationPrompt} from "@/modules/academics/college-hall-cancel-model";
export function CollegeHallCancellationAction({hallId,sessionId,title,updatedAt}:{
  hallId:string;sessionId:string;title:string;updatedAt:string;
}){
  const router=useRouter(),[pending,start]=useTransition();
  const [reason,setReason]=useState("Schedule change"),[error,setError]=useState("");
  function cancel(){
    if(!window.confirm(hallCancellationPrompt(title)))return;
    setError("");
    start(async()=>{
      try{
        const result=await fetch("/api/college/lecture-halls/"+encodeURIComponent(hallId)+
          "/bookings/"+encodeURIComponent(sessionId),{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({reason,expectedUpdatedAt:updatedAt,confirm:true}),
        });
        if(!result.ok){
          const body=await result.json().catch(()=>({error:"CANCELLATION_FAILED"})) as {error?:string};
          throw new Error(body.error??"CANCELLATION_FAILED");
        }
        router.refresh();
      }catch(e){setError(e instanceof Error?e.message:"Cancellation failed");}
    });
  }
  return <div className="mt-3 flex flex-wrap items-end gap-2">
    <label className="grid min-w-48 flex-1 gap-1 text-xs font-semibold text-body">Cancellation reason
      <input value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}
        className="min-h-10 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-foreground"/>
    </label>
    <Button variant="secondary" type="button" disabled={pending||reason.trim().length<3} onClick={cancel}
      className="text-primary-text">
      {pending?"Cancelling…":"Cancel booking"}
    </Button>
    {error?<p role="alert" className="w-full text-xs text-error">{error}</p>:null}
  </div>;
}
