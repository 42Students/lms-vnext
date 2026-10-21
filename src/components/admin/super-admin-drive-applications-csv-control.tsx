"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {useToast} from "@/components/ui/toast";

/** Scoped job-application export; never substitute an unfiltered or global CSV. */
export function SuperAdminDriveApplicationsCsvControl({href,limit}:{href:string;limit:number}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const {showToast}=useToast();
 async function download(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   const response=await fetch(href,{cache:"no-store",credentials:"same-origin"});
   if(!response.ok||!response.headers.get("content-type")?.toLowerCase().startsWith("text/csv"))
    throw Error("Export failed. Check your selected college and filters, then retry.");
   const url=URL.createObjectURL(await response.blob());
   const anchor=document.createElement("a");
   anchor.href=url;anchor.download="applications-export.csv";
   document.body.appendChild(anchor);
   try{anchor.click();}finally{anchor.remove();}
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   showToast({tone:"success",title:"Applications export downloaded"});
  }catch(reason){
   const message=reason instanceof Error?reason.message:"Export failed.";
   setError(message);
   showToast({tone:"error",title:"Export failed",description:message});
  }finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-2 print:hidden">
  <Button variant="secondary" size="sm" className="min-h-11 w-full md:min-h-9 md:w-auto"
   type="button" disabled={busy} loading={busy} onClick={()=>void download()}>
   {busy?"Preparing applications CSV…":"Export CSV (up to "+limit.toLocaleString("en-IN")+")"}
  </Button>
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
 </div>;
}
