"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";

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
 return <div className="min-w-0 space-y-1">
  <Button variant="secondary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={()=>void copy()
  >
   Copy for Claude
  </Button>
  {message?<InlineNotice tone={message.startsWith("Finding prompt")?"success":"error"} message={message}/>:null}
 </div>;
}
