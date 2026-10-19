"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** REC-home-drives-53: refetch after returning to a long-lived recruiter tab,
 * without claiming that a partial network failure means the data is empty. */
export function RecruiterDriveFocusRefresh(){
 const router=useRouter();
 const lastFocus=useRef<number|null>(null);
 const [stale,setStale]=useState(false);
 useEffect(()=>{
  lastFocus.current=Date.now();
  const refresh=()=>{
   const now=Date.now();
   const elapsed=now-(lastFocus.current??now);
   lastFocus.current=now;
   if(elapsed<30_000)return;
   setStale(true);
   router.refresh();
  };
  window.addEventListener("focus",refresh);
  const visible=()=>{if(document.visibilityState==="visible")refresh();};
  document.addEventListener("visibilitychange",visible);
  return ()=>{window.removeEventListener("focus",refresh);
   document.removeEventListener("visibilitychange",visible);};
 },[router]);
 return stale?<div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--lms-control-radius)] border border-warning bg-surface px-4 py-3 text-sm text-body">
  <span>Some drive information may be stale or unavailable.</span>
  <Button variant="secondary" type="button" onClick={()=>{setStale(false);router.refresh();}}>
   Refresh drive
  </Button>
 </div>:null;
}
