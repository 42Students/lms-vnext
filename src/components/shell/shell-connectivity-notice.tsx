"use client";
import {useEffect,useState} from "react";
import {InlineNotice} from "@/components/ui/inline-notice";
/** GR-16: independent connection state; never blocks navigation or removes drafts. */
export function ShellConnectivityNotice(){
 const [offline,setOffline]=useState(false);
 useEffect(()=>{
  const update=()=>setOffline(!navigator.onLine);
  // Server markup cannot know navigator.onLine. Reconcile after hydration.
  update();
  window.addEventListener("online",update);
  window.addEventListener("offline",update);
  return ()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};
 },[]);
 return offline?<div className="min-w-0 border-b border-border px-[var(--lms-space-3)] py-[var(--lms-space-2)] min-[768px]:px-[var(--lms-space-4)]">
  <div className="mx-auto w-full min-w-0 max-w-full break-words"><InlineNotice tone="error" message="You appear to be offline. Changes will not be saved until you reconnect."/></div>
 </div>:null;
}
