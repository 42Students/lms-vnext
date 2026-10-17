"use client";

import {useState} from "react";
import {independentFindingFixPrompt,type IndependentFindingCopySource}
 from "@/modules/bug-tracker/independent-finding-copy-model";

/** SA-tenants-modules-49: copying is explicit and makes no network request. */
export function IndependentFindingCopyAction({finding}:{finding:IndependentFindingCopySource}){
 const [message,setMessage]=useState<string|null>(null);
 async function copy(){
  try{
   if(!navigator.clipboard?.writeText)throw new Error("clipboard unavailable");
   await navigator.clipboard.writeText(independentFindingFixPrompt(finding));
   setMessage("Finding prompt copied.");
  }catch{
   setMessage("Clipboard unavailable. Copy the finding details manually.");
  }
 }
 return <div className="space-y-1">
  <button type="button" onClick={()=>void copy()}
   className="min-h-11 rounded-md border border-border bg-surface px-4 font-semibold text-primary-text">
   Copy for Claude
  </button>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </div>;
}
