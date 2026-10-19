"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {isVerifiedRecruiterDecisionReadReceipt} from "@/modules/placements/recruiter-decision-read-model";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
export function RecruiterDecisionReadButton({id}:{id:string}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [complete,setComplete]=useState(false);
 const lock=useRef(false);
 const [error,setError]=useState("");
 async function read(){
  if(lock.current||complete)return;
  lock.current=true;setBusy(true);setError("");
  try{
   const response=await fetch("/api/notifications/"+encodeURIComponent(id)+"/read",{
    method:"POST",credentials:"same-origin",redirect:"error",
    headers:{Accept:"application/json"},
   });
   if(!response.ok){setError("Could not mark read. Please retry.");return;}
   const payload:unknown=await response.json().catch(()=>null);
   if(!isVerifiedRecruiterDecisionReadReceipt(payload,id)){
    setError("Could not confirm read status. Refresh this page before retrying.");return;
   }
   setComplete(true);router.refresh();
  }catch{setError("Could not mark read. Check your connection.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <div className="mt-2">
  <Button type="button" variant="secondary" className="min-h-11" disabled={busy||complete} loading={busy} onClick={()=>void read()}>
   {complete?"Marked as read":busy?"Saving…":"Mark as read"}
  </Button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
