"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Refresh server-scoped interviews when returning to a drive or a different college. */
export function CollegeDriveScheduleRefresh({scopeKey}:{scopeKey:string}){
  const router=useRouter();
  const previousScope=useRef(scopeKey);
  useEffect(()=>{
    if(previousScope.current!==scopeKey){
      previousScope.current=scopeKey;
      router.refresh();
    }
    const refresh=()=>{if(!document.hidden)router.refresh();};
    window.addEventListener("focus",refresh);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{
      window.removeEventListener("focus",refresh);
      document.removeEventListener("visibilitychange",refresh);
    };
  },[router,scopeKey]);
  return null;
}
