"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
export function TpoTeamDecisionToggle({threadId,messageId,marked}:{
 threadId:string;messageId:string;marked:boolean;
}){
 const router=useRouter(),pending=useRef(false);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function toggle(){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");
  try{
   await apiFetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+
    "/messages/"+encodeURIComponent(messageId)+"/decision",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mark:!marked,expectedMarked:marked}),
   });
   router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not update this decision. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <span className="inline-flex flex-wrap items-center gap-2">
  <Button variant="secondary" type="button" aria-pressed={marked} disabled={busy} onClick={()=>void toggle()}
   className="min-h-11 sm:min-h-9 text-xs">
   {busy?"Saving…":marked?"Unmark decision":"Mark as decision"}
  </Button>
  {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </span>;
}
