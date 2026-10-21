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
   setMessage("Copied. Paste it to the agent that will fix it.");
  }catch{
   setMessage("Clipboard unavailable. Copy the finding details manually.");
  }
 }
 return <div className="space-y-2">
  <Button variant="secondary" type="button" onClick={()=>void copy()}
  >
   Copy for Claude
  </Button>
  {message?<InlineNotice tone={message.startsWith("Copied.")?"success":"error"} message={message}/>:null}
 </div>;
}
