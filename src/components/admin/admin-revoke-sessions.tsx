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
    if(!result || !Number.isSafeInteger(result.revoked) || result.revoked < 0)
      throw new Error("Session revocation could not be confirmed. Refresh before retrying.");
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

 return <div className="min-w-0 space-y-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
  <Button type="button" variant="danger" className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden" disabled={busy||count<1} onClick={()=>{setMessage("");setErrorMessage("");setConfirmOpen(true);}}>
   {busy?"Signing out…":"Sign out everywhere"}
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Sign out everywhere?"
   description="Ends every active session for this administrator, including other colleges. They can sign in again with their existing account. If you need to prevent future sign-ins, use Suspend instead."
   confirmLabel="Sign out everywhere" confirmVariant="danger" pending={busy} confirmDisabled={count<1} onConfirm={()=>void revoke()}>
    {errorMessage?<p role="alert" className="break-words border-l-2 border-error bg-error-subtle p-[var(--lms-space-3)] text-sm text-error">{errorMessage}</p>:null}
  </ConfirmDialog>
  <p className="max-w-prose text-xs leading-5 text-muted-foreground">Revokes all active sessions for this person, across every college. This action is audited.</p>
  {message?<p role="status" aria-live="polite" className="max-w-prose break-words text-sm text-success-text">{message}</p>:null}
 </div>;
}
