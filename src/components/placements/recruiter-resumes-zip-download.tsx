"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useGuardedAction} from "@/hooks/use-guarded-action";

export function RecruiterResumesZipDownload({jobId}:{jobId:string}){
 const [message,setMessage]=useState("");
 const [succeeded,setSucceeded]=useState(false);
 const {run,pending}=useGuardedAction({timeoutMs:120000,busyLabel:"Preparing resumes…"});
 async function download(){
  if(pending)return;
  setMessage("");
  setSucceeded(false);
  try{
   const response=await run(()=>fetch("/api/placements/recruiter/jobs/"+
    encodeURIComponent(jobId)+"/applicants/resumes/export",{
     method:"GET",credentials:"same-origin",cache:"no-store",
    }));
   if(!response||!response.ok)throw new Error("RESUMES_NOT_AVAILABLE");
   const body=await response.blob();
   if(body.size===0||!body.type.includes("zip"))throw new Error("INVALID_ARCHIVE");
   const url=URL.createObjectURL(body);
   const link=document.createElement("a");
   link.href=url;
   link.download="recruiter-shared-resumes.zip";
   document.body.append(link);
   link.click();
   link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),30000);
   setSucceeded(true);
   setMessage("Shared resumes ZIP prepared. The archive includes a file-count and limit manifest.");
  }catch{
   setMessage("Could not prepare the resumes. Try again or ask the placement cell to verify the shared files.");
  }
 }
 return <div className="min-w-0 space-y-2">
  <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
   disabled={pending} loading={pending} onClick={()=>void download()}>
   {pending?"Preparing resumes…":"Download resumes (ZIP)"}
  </Button>
  {message?<InlineNotice tone={succeeded?"success":"error"} message={message}/>:null}
 </div>;
}
