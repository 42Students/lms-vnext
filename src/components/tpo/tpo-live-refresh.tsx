"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

/** Refresh only when the persisted inbox pulse changes; hidden tabs do no work.
 * The current server-rendered conversation remains on screen if polling fails.
 */
export function TpoLiveRefresh({intervalMs,pulseHref}:{intervalMs:4000|30000;pulseHref?:string}){
 const router=useRouter();
 const lastVersion=useRef<string|null>(null);
 const inFlight=useRef(false);
 const [refreshError,setRefreshError]=useState(false);
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{
   if(!active||document.visibilityState!=="visible"||inFlight.current)return;
   if(!pulseHref){router.refresh();return;}
   inFlight.current=true;
   try{
    const response=await fetch(pulseHref,{credentials:"same-origin",cache:"no-store"});
    if(!response.ok)throw new Error("MESSAGE_PULSE_FAILED");
    const data:unknown=await response.json();
    if(!data||typeof data!=="object"||!("version" in data)||
       typeof data.version!=="string")throw new Error("INVALID_MESSAGE_PULSE");
    if(!active)return;
    const version=data.version;
    if(lastVersion.current!==null&&lastVersion.current!==version)router.refresh();
    lastVersion.current=version;
    setRefreshError(false);
   }catch{if(active)setRefreshError(true);}
   finally{inFlight.current=false;}
  };
  const timer=window.setInterval(()=>{void refresh();},intervalMs);
  const onVisible=()=>{void refresh();};
  window.addEventListener("focus",onVisible);
  document.addEventListener("visibilitychange",onVisible);
  void refresh();
  return ()=>{
   active=false;
   window.clearInterval(timer);
   window.removeEventListener("focus",onVisible);
   document.removeEventListener("visibilitychange",onVisible);
  };
 },[router,intervalMs,pulseHref]);
 return refreshError?<p role="status" className="border-l-2 border-warning px-3 py-2 text-sm text-warning-text">
  This refresh failed. Existing conversations remain visible. Retry by returning to this tab.
 </p>:null;
}
