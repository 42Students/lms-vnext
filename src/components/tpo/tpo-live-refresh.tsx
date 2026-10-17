"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

/** Read-only refresh: preserves current URL filters and never acknowledges messages. */
export function TpoLiveRefresh({intervalMs}:{intervalMs:4000|30000}){
 const router=useRouter();
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState==="visible")router.refresh();};
  const timer=window.setInterval(refresh,intervalMs);
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{
   window.clearInterval(timer);
   window.removeEventListener("focus",refresh);
   document.removeEventListener("visibilitychange",refresh);
  };
 },[router,intervalMs]);
 return null;
}
