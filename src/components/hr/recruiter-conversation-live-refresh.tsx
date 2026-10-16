"use client";
import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";

/** Poll a lightweight version, not the full message list, only while visible. */
export function RecruiterConversationLiveRefresh({collegeId,threadId}:{
 collegeId:string;threadId?:string;
}){
 const router=useRouter();
 const last=useRef<string|null>(null);
 useEffect(()=>{
  let disposed=false;
  let busy=false;
  async function refreshIfChanged(){
   if(disposed||busy||document.visibilityState!=="visible")return;
   busy=true;
   try{
    const params=new URLSearchParams({collegeId});
    if(threadId)params.set("threadId",threadId);
    const result=await fetch("/api/placements/recruiter/conversations/pulse?"+params.toString(),{
     credentials:"same-origin",cache:"no-store",
    });
    if(!result.ok)return;
    const raw:unknown=await result.json();
    const version=raw&&typeof raw==="object"&&"version" in raw
     ?(raw as {version:unknown}).version:null;
    if(typeof version!=="string"||disposed)return;
    if(last.current!==null&&last.current!==version)router.refresh();
    last.current=version;
   }catch{/* Stale view remains visible; the next pulse retries. */}
   finally{busy=false;}
  }
  const onVisibility=()=>{void refreshIfChanged();};
  void refreshIfChanged();
  const timer=window.setInterval(()=>{void refreshIfChanged();},4000);
  document.addEventListener("visibilitychange",onVisibility);
  window.addEventListener("focus",onVisibility);
  return()=>{
   disposed=true;window.clearInterval(timer);
   document.removeEventListener("visibilitychange",onVisibility);
   window.removeEventListener("focus",onVisibility);
  };
 },[collegeId,threadId,router]);
 return null;
}
