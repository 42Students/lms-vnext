"use client";
import {useEffect,useState} from "react";

/** REC-home-drives-22: show a one-time receipt only after the server
 * returned an actual persisted request. A URL alone cannot forge success. */
export function RecruiterRequestFeedback({storageKey}:{storageKey:string}){
 const [notice,setNotice]=useState<string|null>(null);
 useEffect(()=>{
  try{
   const message=window.sessionStorage.getItem(storageKey);
   if(!message || !["Saved. The placement cell sees the new version.","Sent for review.","Request resent to the placement cell."].includes(message))return;
   window.sessionStorage.removeItem(storageKey);
   queueMicrotask(()=>setNotice(message));
  }catch{/* Storage unavailable: no unverified success claim. */}
 },[storageKey]);
 return notice?<p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm font-semibold text-body">
  {notice}
 </p>:null;
}
