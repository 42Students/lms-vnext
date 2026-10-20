"use client";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
/** A POST, not a GET side effect, moves the user's per-thread read pointer on open. */
export function TpoTeamOpenRead({threadId}:{threadId:string}){
 const router=useRouter();
 const [failed,setFailed]=useState(false);
 const [retryAttempt,setRetryAttempt]=useState(0);
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
 },[threadId,router,retryAttempt]);
 return failed?<Alert tone="error" className="flex-row flex-wrap items-center gap-3">
  <span>Could not mark this conversation as read.</span>
  <Button variant="secondary" type="button" className="min-h-11 md:min-h-9"
   onClick={()=>{setFailed(false);setRetryAttempt(count=>count+1);}}>Retry</Button>
 </Alert>:null;
}
