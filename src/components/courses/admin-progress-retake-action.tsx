"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";
import {useToast} from "@/components/ui/toast";
type Preview={attempt:number;contentItems:number;alreadyFresh:boolean};
export function AdminProgressRetakeAction({offeringId,membershipId,learnerName}:{
 offeringId:string;membershipId:string;learnerName:string;
}){
 const router=useRouter(),{showToast}=useToast();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState<string|null>(null);
 const params=new URLSearchParams({offeringId,membershipId});
 async function review(){
  if(busy)return;
  setBusy(true);setError(null);
  try{
   const response=await fetch("/api/admin/course-progress/retake?"+params,{
    credentials:"same-origin",cache:"no-store",
   });
   if(!response.ok)throw new Error("Unable to check the current progress attempt.");
   const value=await response.json() as Preview;
   setPreview(value);setOpen(true);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load progress attempt.");}
  finally{setBusy(false);}
 }
 async function confirm(){
  if(busy||!preview)return;
  if(preview.alreadyFresh){setOpen(false);return;}
  setBusy(true);setError(null);
  try{
   const response=await fetch("/api/admin/course-progress/retake",{
    method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({offeringId,membershipId,expectedAttempt:preview.attempt,confirmed:true}),
   });
   if(!response.ok)throw new Error(response.status===409
     ?"The progress attempt changed. Review it again.":"Could not start a new attempt.");
   const result=await response.json() as {attempt:number};
   setOpen(false);setPreview(null);
   showToast({tone:"success",title:"Attempt "+result.attempt+" started",description:"Previous progress was kept as history."});
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Retake unavailable.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-2">
  <Button variant="secondary" disabled={busy} loading={busy} type="button" onClick={()=>void review()}>
   Review retake
  </Button>
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  <ConfirmDialog open={open} onOpenChange={next=>{if(!busy)setOpen(next);}}
   title={"Start a new progress attempt for "+learnerName+"?"}
   description={preview?.alreadyFresh
    ?"This learner has no recorded progress in this course and is already starting fresh."
    :"This resets current video/content completion for this course without deleting previous attempts. It does not reset assignment submissions or quiz grades."}
   confirmLabel={preview?.alreadyFresh?"Close":"Start next attempt"}
   confirmVariant="primary" pending={busy} onConfirm={()=>void confirm()}>
   {preview?<p className="text-sm text-body">Current attempt {preview.attempt}
    {" · "}{preview.contentItems} course content item(s)</p>:null}
  </ConfirmDialog>
 </div>;
}
