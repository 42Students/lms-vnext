"use client";
import {useRef,useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useRouter} from "next/navigation";
export function SuperAdminDriveDuplicate({jobId,title}:{jobId:string;title:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const inFlightRef=useRef(false);
 async function duplicate(){
  if(busy||inFlightRef.current)return;
  inFlightRef.current=true;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/placements/jobs/"+encodeURIComponent(jobId)+"/duplicate",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirmed:true}),
   });
   const result=await response.json().catch(()=>null);
   if(!response.ok||!result?.jobId)throw new Error("Could not duplicate drive.");
   setConfirmOpen(false);
   router.push("/admin/placements/jobs/"+encodeURIComponent(result.jobId));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not duplicate drive.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <div className="space-y-2">
  <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>{setError("");setConfirmOpen(true);}} disabled={busy}>
   {busy?"Creating draft…":"Duplicate as new drive"}</Button>
  {error&&!confirmOpen?<InlineNotice tone="error" message={error}/>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={open=>{if(!open&&!busy)setConfirmOpen(false);}}
   title={'Duplicate "'+title+'" as a new drive?'}
   description="Dates, applications, interview rounds, offers, and candidate decisions will not be copied."
   confirmLabel="Duplicate as new drive" confirmVariant="primary" pending={busy}
   onConfirm={()=>void duplicate()}>
   {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </div>;
}
