"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Button} from "@/components/ui/button";

/** A signed resume URL exists only in an ephemeral response to this click.
 * Never place a raw private receipt or object key into SSR props, DOM or storage.
 */
export function RecruiterResumeDownload({jobId,applicationId}:{jobId:string;applicationId:string}){
 const [message,setMessage]=useState("");
 const {run,pending}=useGuardedAction({timeoutMs:15000,busyLabel:"Preparing resume…"});
 async function openResume(){
  if(pending)return;
  setMessage("");
  try{
   const response=await run(()=>fetch("/api/placements/recruiter/jobs/"+
    encodeURIComponent(jobId)+"/applicants/"+encodeURIComponent(applicationId)+"/resume-grant",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:"{}",cache:"no-store",
   }));
   if(!response||!response.ok)throw new Error("RESUME_NOT_AVAILABLE");
   const json=await response.json() as {grant?:{url?:string}};
   const url=json.grant?.url;
   if(!url||new URL(url).protocol!=="https:")throw new Error("INVALID_RESUME_GRANT");
   const anchor=document.createElement("a");
   anchor.href=url;anchor.target="_blank";anchor.rel="noopener noreferrer";
   document.body.append(anchor);anchor.click();anchor.remove();
   setMessage("Resume link opened. If your browser blocked it, try again.");
  }catch{
   setMessage("The shared resume is not available right now. Ask the placement cell to verify the file or try again.");
  }
 }
 return <div className="space-y-1">
  <Button type="button" variant="secondary" onClick={()=>void openResume()} disabled={pending}>
   {pending?"Preparing resume…":"Open shared resume"}
  </Button>
  {message?<p role="status" className="text-xs text-body">{message}</p>:null}
 </div>;
}
