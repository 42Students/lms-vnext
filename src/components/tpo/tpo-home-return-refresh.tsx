"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

/** TPO-home-22: failed background refresh keeps the rendered server snapshot.
 * Preflight the actual dynamic Home route before triggering router.refresh,
 * so an outage does not replace the previous successful Home with an error.
 * The server remains responsible for permission and data checks. */
export function TpoHomeReturnRefresh(){
 const router=useRouter();
 const hiddenSince=useRef<number|null>(null);
 const lastRefresh=useRef(0);
 const inFlight=useRef<AbortController|null>(null);
 const [busy,setBusy]=useState(false);
 const [failed,setFailed]=useState(false);
 async function refresh(){
  if(inFlight.current)return;
  const controller=new AbortController();
  inFlight.current=controller;
  setBusy(true);setFailed(false);
  try{
   const response=await fetch("/tpo/home",{
    credentials:"same-origin",cache:"no-store",
    headers:{"Accept":"text/html"},signal:controller.signal,
   });
   // Wait for the streamed HTML to finish. A header-only 200 can precede
   // a server-rendered failure and must not clear the previous snapshot.
   await response.text();
   if(!response.ok||response.redirected)throw Error("HOME_REFRESH_UNAVAILABLE");
   lastRefresh.current=Date.now();
   router.refresh();
  }catch{
   if(!controller.signal.aborted)setFailed(true);
  }finally{
   if(inFlight.current===controller){inFlight.current=null;setBusy(false);}
  }
 }
 useEffect(()=>{
  const handle=()=>{
   if(document.visibilityState==="hidden"){
    hiddenSince.current=Date.now();
    return;
   }
   const now=Date.now();
   if(hiddenSince.current===null)return;
   const elapsed=now-hiddenSince.current;
   hiddenSince.current=null;
   if(elapsed<1000||now-lastRefresh.current<15000)return;
   void refresh();
  };
  document.addEventListener("visibilitychange",handle);
  return ()=>{
   document.removeEventListener("visibilitychange",handle);
   inFlight.current?.abort();
  };
 },[router]);
 return <div aria-live="polite" className="space-y-2">
  {busy?<p role="status" className="text-xs text-muted-foreground">Refreshing placement home…</p>:null}
  {failed?<div role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--lms-canvas-radius)] border border-border p-3 text-sm">
    <span>Home refresh failed. Showing the last successful snapshot.</span>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>void refresh()}
      className="min-h-9">Retry</Button>
  </div>:null}
 </div>;
}
