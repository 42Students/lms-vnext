"use client";
import {useEffect,useState} from "react";
import {InlineNotice} from "@/components/ui/inline-notice";
/** GR-16: independent connection state; never blocks navigation or removes drafts. */
export function ShellConnectivityNotice(){
 const [offline,setOffline]=useState(false);
 useEffect(()=>{
  const update=()=>setOffline(!navigator.onLine);
  window.addEventListener("online",update);
  window.addEventListener("offline",update);
  update();
  return ()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};
 },[]);
 return offline?<div className="border-b border-border bg-surface px-4 py-2">
  <InlineNotice tone="error" message="You appear to be offline. Changes will not be saved until you reconnect."/>
 </div>:null;
}
