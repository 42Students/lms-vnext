"use client";
import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";
/** Refresh the server Home snapshot after returning to an inactive TPO tab.
 * A short throttle avoids repeated router refreshes when the browser toggles
 * visibility rapidly; refresh never mutates server data. */
export function TpoHomeReturnRefresh(){
 const router=useRouter();
 const hiddenSince=useRef<number|null>(null);
 const lastRefresh=useRef(0);
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
   lastRefresh.current=now;
   router.refresh();
  };
  document.addEventListener("visibilitychange",handle);
  return ()=>document.removeEventListener("visibilitychange",handle);
 },[router]);
 return null;
}
