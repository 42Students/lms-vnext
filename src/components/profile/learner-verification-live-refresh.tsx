"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
/** Refresh only the current learner's server-authorized section statuses. */
export function LearnerVerificationLiveRefresh(){
 const router=useRouter();
 useEffect(()=>{
  const id=window.setInterval(()=>{if(document.visibilityState==="visible")router.refresh();},15000);
  return ()=>window.clearInterval(id);
 },[router]);
 return null;
}
