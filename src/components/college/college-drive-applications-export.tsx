"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";

/** Scoped CSV download with true success/error feedback and truncation counts. */
export function CollegeDriveApplicationsExport({href,matching,cap}:{
 href:string;matching:number;cap:number;
}){
 const {showToast}=useToast();
 const [downloading,setDownloading]=useState(false);
 async function download(){
  if(downloading)return;
  setDownloading(true);
  try{
   const controller=new AbortController();
   const timer=window.setTimeout(()=>controller.abort(),30_000);
   let response:Response;
   try{response=await fetch(href,{credentials:"same-origin",cache:"no-store",signal:controller.signal});}
   finally{window.clearTimeout(timer);}
   if(!response.ok)throw new Error(response.status===422
     ?"Score filtering is unavailable for this drive.":"The filtered export could not be downloaded.");
   const blob=await response.blob();
   const filename=response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1]
    ??"applications.csv";
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1_000);
   const count=Number(response.headers.get("x-export-rows")??0);
   const total=Number(response.headers.get("x-export-matching-rows")??matching);
   const truncated=response.headers.get("x-export-truncated")==="true";
   showToast({tone:"success",title:"Export downloaded",
     description:truncated
       ?`Downloaded ${count} of ${total} matching applications. Narrow your filters to export the remainder.`
       :`Downloaded ${count} matching applications.`});
  }catch(error){
   showToast({tone:"error",title:"Export failed",description:error instanceof Error
     ?error.name==="AbortError"?"The export timed out. Try again.":error.message
     :"The export could not be downloaded."});
  }finally{setDownloading(false);}
 }
 return <div className="flex min-w-0 flex-col items-start gap-1">
  <Button type="button" variant="secondary" loading={downloading} disabled={downloading}
    className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={()=>void download()}>
   {downloading?"Preparing export…":`↓ Export CSV (up to ${cap.toLocaleString("en-IN")})`}
  </Button>
  {matching>cap?<p role="status" className="m-0 text-xs text-muted-foreground">
   Only the first {cap.toLocaleString("en-IN")} of {matching.toLocaleString("en-IN")} matching applications are included.
  </p>:null}
 </div>;
}
