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
 type SessionRow={id:string;device_name:string|null;user_agent:string|null;
   last_seen_at:string;created_at:string;expires_at:string};
 const [expanded,setExpanded]=useState(false);
 const [devices,setDevices]=useState<SessionRow[]|null>(null);
 const [sessionError,setSessionError]=useState("");
 const [loadingSessions,setLoadingSessions]=useState(false);
 async function loadSessions(){
  if(loadingSessions)return;
  setSessionError("");setLoadingSessions(true);
  try{
   const result=await apiFetch<{devices:SessionRow[]}>(
    "/api/admin/colleges/"+encodeURIComponent(collegeId)+
    "/sessions?userId="+encodeURIComponent(userId),{credentials:"same-origin"});
   if(!result||!Array.isArray(result.devices))throw new Error("Session list unavailable");
   setDevices(result.devices);
  }catch{
   setSessionError("Could not load active sessions. Retry.");
  }finally{setLoadingSessions(false);}
 }
 function sessionTime(value:string){
  const date=new Date(value);
  return Number.isFinite(date.getTime())
   ?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
      timeZone:"Asia/Kolkata"}).format(date)+" IST":"—";
 }
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
    setMessage(result.revoked===0?"No active sessions remained to sign out.":
     result.revoked<count?result.revoked+" session(s) revoked. Some sessions were no longer active.":
     result.revoked+" session(s) revoked.");
    if(expanded)await loadSessions();
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
  <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
   aria-expanded={expanded} onClick={()=>{setExpanded(v=>!v);if(!expanded)void loadSessions();}}>
   {expanded?"Hide active sessions":"View active sessions"}
  </Button>
  {expanded?<section className="min-w-0 space-y-3" aria-label="Administrator active device sessions">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h3 className="text-sm font-semibold">Active sessions</h3>
    <Button type="button" variant="secondary" disabled={loadingSessions}
     onClick={()=>void loadSessions()}>{loadingSessions?"Loading…":"Refresh"}</Button>
   </div>
   {sessionError?<p role="alert" className="text-sm text-error">{sessionError}</p>:null}
   {loadingSessions&&!devices?<p role="status" className="text-sm text-muted-foreground">Loading device sessions…</p>:null}
   {devices?.length===0?<p className="text-sm text-muted-foreground">No active sessions for this administrator.</p>:null}
   {devices&&devices.length>0?<ul className="divide-y divide-border rounded-[var(--lms-control-radius)] border border-border">
    {devices.map(device=><li key={device.id} className="min-w-0 space-y-1 p-3 text-sm">
     <p className="truncate font-semibold">{device.device_name?.trim()||"Unidentified device"}</p>
     <p className="break-words text-muted-foreground">{device.user_agent?.slice(0,120)||"Device details unavailable"}</p>
     <p className="text-xs text-muted-foreground">Last used {sessionTime(device.last_seen_at)} · Signed in {sessionTime(device.created_at)}</p>
    </li>)}
   </ul>:null}
  </section>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Sign out everywhere?"
   description="Ends every active session for this administrator, including other colleges. They can sign in again with their existing account. If you need to prevent future sign-ins, use Suspend instead."
   confirmLabel="Sign out everywhere" confirmVariant="danger" pending={busy} confirmDisabled={count<1} onConfirm={()=>void revoke()}>
    {errorMessage?<p role="alert" className="break-words border-l-2 border-error bg-error-subtle p-[var(--lms-space-3)] text-sm text-error">{errorMessage}</p>:null}
  </ConfirmDialog>
  <p className="max-w-prose text-xs leading-5 text-muted-foreground">Revokes all active sessions for this person, across every college. This action is audited.</p>
  {message?<p role="status" aria-live="polite" className="max-w-prose break-words text-sm text-success-text">{message}</p>:null}
 </div>;
}
