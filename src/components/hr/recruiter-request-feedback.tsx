"use client";
import {useEffect,useState} from "react";
import { InlineNotice } from "@/components/ui/inline-notice";
import {hrVerifiedDriveReceiptMessage} from "@/modules/placements/hr-drive-request-feedback-model";

/** REC-home-drives-22: show a one-time receipt only after the server
 * returned an actual persisted request. A URL alone cannot forge success. */
export function RecruiterRequestFeedback({storageKey}:{storageKey:string}){
 const [notice,setNotice]=useState<string|null>(null);
 useEffect(()=>{
  try{
   const message=window.sessionStorage.getItem(storageKey);
   const verified=hrVerifiedDriveReceiptMessage(message);
   if(!verified)return;
   window.sessionStorage.removeItem(storageKey);
   queueMicrotask(()=>setNotice(verified));
  }catch{/* Storage unavailable: no unverified success claim. */}
 },[storageKey]);
 return notice?<InlineNotice tone="success" message={notice}/>:null;
}
