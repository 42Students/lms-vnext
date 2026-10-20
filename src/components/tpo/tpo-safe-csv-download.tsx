"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useRef,useState} from "react";
/** A failed export must never download HTML or JSON as if it were a CSV. */
export function TpoSafeCsvDownload({href,filename,label}:{href:string;filename:string;label:string}){
 const inFlight=useRef(false);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 async function download(){
  if(inFlight.current)return;
  inFlight.current=true;setPending(true);setError("");
  try{
   const response=await fetch(href,{credentials:"same-origin",cache:"no-store",headers:{Accept:"text/csv"}});
   if(!response.ok||!response.headers.get("content-type")?.toLowerCase().includes("text/csv")){
    throw new Error(response.status===401?"Your session has ended. Please sign in again.":
      response.status===403?"You do not have permission to export this list.":
      "Could not prepare this export. Please try again.");
   }
   const data=await response.blob();
   if(data.size===0)throw new Error("The export was empty. Please review your filters and try again.");
   const url=URL.createObjectURL(data);
   try{
    const link=document.createElement("a");
    link.href=url;link.download=filename;document.body.appendChild(link);
    try { link.click(); }
    finally { link.remove(); }
   }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }catch(cause){
   setError(cause instanceof Error && (
    cause.message==="Your session has ended. Please sign in again."||
    cause.message==="You do not have permission to export this list."||
    cause.message==="Could not prepare this export. Please try again."||
    cause.message==="The export was empty. Please review your filters and try again."
   )?cause.message:"Could not download the export. Check your connection and try again.");
  }finally{inFlight.current=false;setPending(false);}
 }
 return <span className="inline-flex max-w-full min-w-0 flex-col items-start gap-2 print:hidden">
  <Button variant="secondary" type="button" disabled={pending} onClick={()=>void download()}
   className="min-h-11 max-w-full whitespace-normal break-words text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
   {pending?"Preparing export…":label}
  </Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
 </span>;
}
