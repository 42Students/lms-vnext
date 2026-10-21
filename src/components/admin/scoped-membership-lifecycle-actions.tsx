"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScopedMembershipLifecycleActions({membershipId,displayName,status,roleLabel}:{
 membershipId:string;displayName:string;status:string;roleLabel?:"Student"|"Faculty";
}) {
 const router=useRouter();
 const [reason,setReason]=useState("");
 const [open,setOpen]=useState(false);
 const [confirming,setConfirming]=useState<"SUSPEND"|"REACTIVATE"|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 const targetLabel=roleLabel??"College membership";
 const personLabel=(targetLabel+" "+displayName).trim();
 async function change(action:"SUSPEND"|"REACTIVATE") {
  if(busy)return;
  if(action==="SUSPEND"&&reason.trim().length<3){setError("Enter a reason of at least 3 characters.");return;}
  setBusy(true);setError(null);setNotice(null);
  try{
   const response=await fetch("/api/people/"+encodeURIComponent(membershipId)+"/lifecycle",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify(action==="SUSPEND"?{action,reason:reason.trim()}:{action}),
   });
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(response.status===409
     ?"Membership status changed elsewhere. Refresh before trying again."
     : response.status===403?"You no longer have permission to change this membership."
     : "Could not change membership status.");
   const expected=action==="SUSPEND"?"SUSPENDED":"ACTIVE";
   if(data?.person?.membership?.status!==expected)
     throw new Error("The server did not confirm the requested membership status. Refresh before retrying.");
   setOpen(false);setReason("");setConfirming(null);
   setNotice(targetLabel+" "+(action==="SUSPEND"?"suspended":"reactivated")+
     ". This is a college membership action, not a permanent global account change.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update membership");}
  finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-[var(--lms-space-3)] print:hidden">
  {status==="ACTIVE"?<>
   <Button variant="secondary" type="button" onClick={()=>{setError(null);setNotice(null);setOpen(current=>!current);}} disabled={busy}
    className="min-h-11 w-full sm:w-auto md:min-h-9" aria-expanded={open}
    aria-label={"Suspend "+personLabel} title={"Suspend "+personLabel}>
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 12h6"/></svg>
    Suspend
   </Button>
   {open?<div role="region" aria-label={"Suspend "+personLabel} className="min-w-0 space-y-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)]">
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Reason for suspension
     <Textarea value={reason} maxLength={1000} rows={2}
      onChange={event=>setReason(event.target.value)}
      className="min-h-24 w-full"/>
    </label>
    <p className="text-xs text-muted-foreground">
      This action is reversible within the college; unlike the legacy Delete Student flow, no attendance, grade, identity or historical record is permanently erased.
      Suspends only this college membership. Active device sessions for this person
      are revoked; they must sign in again to use any other active college membership.
    </p>
    <Button variant="danger" type="button" disabled={busy||reason.trim().length<3} onClick={()=>setConfirming("SUSPEND")}
     aria-label={"Confirm suspension for "+personLabel}
     className="min-h-11 w-full sm:w-auto md:min-h-9">Confirm suspension</Button>
   </div>:null}
  </>:status==="SUSPENDED"?<Button variant="secondary" type="button" disabled={busy}
   aria-label={"Reactivate "+personLabel} title={"Reactivate "+personLabel}
   className="min-h-11 w-full sm:w-auto md:min-h-9"
   onClick={()=>{setError(null);setNotice(null);setConfirming("REACTIVATE");}}>
   <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2-5.4M4 4v5h5"/></svg>
   Reactivate
  </Button>:
    <p className="text-xs text-muted-foreground">Ended membership · read only</p>}
  <ConfirmDialog open={confirming!==null} onOpenChange={value=>{if(!value&&!busy)setConfirming(null);}}
   title={confirming==="SUSPEND"?"Suspend "+targetLabel+"?":"Reactivate "+targetLabel+"?"}
   description={(confirming==="SUSPEND"?"Suspend ":"Reactivate ")+displayName+
     " in this college? "+(confirming==="SUSPEND"
       ?"All of this person's active device sessions will be revoked, but other college memberships are not suspended."
       :"This restores access to this college membership only. It will not restore revoked sessions.")}
   confirmLabel={confirming==="SUSPEND"?"Suspend "+targetLabel:"Reactivate "+targetLabel}
   confirmVariant={confirming==="SUSPEND"?"danger":"primary"} pending={busy}
   confirmDisabled={confirming==="SUSPEND"&&reason.trim().length<3}
   onConfirm={()=>{if(confirming)void change(confirming);}}>
    {error?<p role="alert" className="break-words border-l-2 border-error bg-error-subtle p-[var(--lms-space-3)] text-sm text-error">{error}</p>:null}
   </ConfirmDialog>
  {error&&confirming===null?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" aria-live="polite" className="text-sm text-success-text">{notice}</p>:null}
 </div>;
}
