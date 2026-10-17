"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
/** A POST, not a GET side effect, moves the user's per-thread read pointer on open. */
export function TpoTeamOpenRead({threadId}:{threadId:string}){
 const router=useRouter();
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let active=true;
  async function acknowledge(){
   try{
    await apiFetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/acknowledge",{
     method:"POST",credentials:"same-origin",timeoutMs:12000,
     headers:{Accept:"application/json"},
    });
    if(active)router.refresh();
   }catch{if(active)setFailed(true);}
  }
  void acknowledge();
  return ()=>{active=false;};
 },[threadId,router]);
 return failed?<p role="alert" className="text-sm text-danger">
  Could not mark this conversation as read. Use the button below to retry.
 </p>:null;
}
