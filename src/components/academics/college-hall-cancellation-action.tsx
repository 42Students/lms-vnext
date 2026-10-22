"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState,useTransition} from "react";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useRouter} from "next/navigation";
import {hallCancellationPrompt} from "@/modules/academics/college-hall-cancel-model";
import {Input} from "@/components/ui/input";
export function CollegeHallCancellationAction({hallId,sessionId,title,updatedAt}:{
  hallId:string;sessionId:string;title:string;updatedAt:string;
}){
  const router=useRouter(),[pending,start]=useTransition();
  const {askConfirm,dialog}=useConfirmFlow();
  const pendingRef=useRef(false);
  const [reason,setReason]=useState("Schedule change"),[error,setError]=useState("");
  async function cancel(){
    if(pendingRef.current||pending)return;
    if(!(await askConfirm(hallCancellationPrompt(title))))return;
    if(pendingRef.current)return;
    pendingRef.current=true;
    setError("");
    start(async()=>{
      try{
        const result=await fetch("/api/college/lecture-halls/"+encodeURIComponent(hallId)+
          "/bookings/"+encodeURIComponent(sessionId),{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({reason,expectedUpdatedAt:updatedAt,confirm:true}),
        });
        if(!result.ok)throw new Error("Cancellation could not be saved. Check whether the session changed before retrying.");
        router.refresh();
      }catch{setError("Cancellation could not be saved. Check whether the session changed before retrying.");}
      finally{pendingRef.current=false;}
    });
  }
  return <details className="mt-3 min-w-0">
    <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Cancel booking</summary>
    <div className="grid min-w-0 grid-cols-1 items-end gap-2 pt-2 md:grid-cols-[minmax(0,1fr)_auto]">
    <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Cancellation reason
      <Input value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}
        className="min-h-11 md:min-h-9 border border-border px-3"/>
    </label>
    <Button variant="danger" type="button" loading={pending} disabled={pending||reason.trim().length<3} onClick={cancel}
      className="min-h-11 w-full md:min-h-9 md:w-auto">
      {pending?"Cancelling…":"Cancel booking"}
    </Button>
    {error?<p role="alert" className="w-full text-xs text-error md:col-span-2">{error}</p>:null}
    </div>
    {dialog}
  </details>;
}
