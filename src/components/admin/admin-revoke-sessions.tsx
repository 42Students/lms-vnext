"use client";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

import {useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
export function AdminRevokeSessions({collegeId,userId,count}:{collegeId:string;userId:string;count:number}){
 const router=useRouter();
 const {run,pending:busy}=useGuardedAction();
 const [message,setMessage]=useState("");
 const [errorMessage,setErrorMessage]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 async function revoke(){
  if(busy||count<1)return;
  setMessage("");setErrorMessage("");
  try{
   await run(async()=>{
    // A synchronous flight lock prevents rapid double-confirm or Enter repeats
    // from revoking twice while React has not painted the pending state.
    const result=await apiFetch<{revoked:number}>(
     "/api/admin/colleges/"+encodeURIComponent(collegeId)+"/sessions",{
      method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
      body:JSON.stringify({userId,confirm:true}),
     });
    setConfirmOpen(false);
    setMessage(result.revoked+" session(s) revoked.");
    router.refresh();
   });
  }catch(error){
   // apiFetch maps network, timeout, HTML proxy responses and API error codes
   // to customer-safe messages without exposing infrastructure internals.
   setErrorMessage(error instanceof Error?error.message:"Unable to revoke sessions. Please retry.");
  }
 }

 return <div className="space-y-2">
  <Button type="button" variant="danger" className="min-h-11 md:min-h-9 print:hidden" disabled={busy||count<1} onClick={()=>setConfirmOpen(true)}>
   {busy?"Signing out…":"Sign out everywhere"}
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Sign out everywhere?" description={"All active sessions for this administrator, including other colleges, will be revoked immediately."+(errorMessage?" "+errorMessage:"")} confirmLabel="Sign out everywhere" confirmVariant="danger" pending={busy} onConfirm={()=>void revoke()}/>
  <p className="text-xs text-muted-foreground">Revokes all active sessions for this person, across every college. This action is audited.</p>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </div>;
}
