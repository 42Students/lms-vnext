"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ScopedMembershipLifecycleActions({membershipId,displayName,status,roleLabel}:{
 membershipId:string;displayName:string;status:string;roleLabel?:"Student"|"Faculty";
}) {
 const router=useRouter();
 const [reason,setReason]=useState("");
 const [open,setOpen]=useState(false);
 const [confirming,setConfirming]=useState<"SUSPEND"|"REACTIVATE"|null>(null);
 const [busy,setBusy]=useState(false);
 const [retireOpen,setRetireOpen]=useState(false);
 const [retireImpact,setRetireImpact]=useState<{canEnd:boolean;courses:number;schedules:number;projects:number;otherRoles:boolean}|null>(null);
 const [retireBusy,setRetireBusy]=useState(false);
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
 async function prepareRetirement(){
  if(busy||retireBusy)return;
  setRetireBusy(true);setRetireImpact(null);setError(null);
  try{
   const response=await fetch("/api/admin/faculty/memberships/"+
     encodeURIComponent(membershipId)+"/retire",{cache:"no-store"});
   if(!response.ok)throw new Error("Could not check faculty dependencies.");
   const impact=await response.json() as {canEnd:boolean;courses:number;schedules:number;projects:number;otherRoles:boolean};
   setRetireImpact(impact);
   setRetireOpen(true);
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not check faculty dependencies.");}
  finally{setRetireBusy(false);}
 }
 async function retireFaculty(){
  if(retireBusy||!retireImpact?.canEnd)return;
  setRetireBusy(true);setError(null);
  try{
   const response=await fetch("/api/admin/faculty/memberships/"+
     encodeURIComponent(membershipId)+"/retire",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({confirmed:true}),
   });
   if(!response.ok)throw new Error(response.status===409?
     "Faculty assignments or other roles remain. Review dependencies and retry.":
     "Could not retire this faculty membership.");
   const result=await response.json() as {status:string};
   if(result.status!=="ENDED")throw new Error("The server did not confirm retirement.");
   setRetireOpen(false);setRetireImpact(null);
   setNotice("Faculty membership ended. Course, project and identity history remain intact.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not retire faculty.");}
  finally{setRetireBusy(false);}
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
  <div className="flex flex-wrap items-center gap-3">
   <Link href="/admin/otp-lockout" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
    Clear OTP lockout
   </Link>
   {roleLabel==="Faculty"&&status!=="ENDED"?<Button variant="danger" type="button"
     disabled={busy||retireBusy} onClick={()=>void prepareRetirement()}>
     {retireBusy?"Checking dependencies…":"Retire Faculty"}
   </Button>:null}
  </div>
  {roleLabel==="Student"?<p className="text-xs text-muted-foreground">
    Legacy permanent Delete is replaced by a college-scoped membership lifecycle.
    Student records, attendance and grades cannot be erased through this action.
   </p>:null}
  <ConfirmDialog open={retireOpen} onOpenChange={value=>{if(!value&&!retireBusy)setRetireOpen(false);}}
    title={"Retire faculty "+displayName+"?"} confirmLabel="Retire Faculty"
    pending={retireBusy} confirmVariant="danger" confirmDisabled={!retireImpact?.canEnd}
    onConfirm={()=>void retireFaculty()}>
    <div className="space-y-2 text-sm text-body">
      <p>This ends the selected faculty membership only. It does not delete their
      shared account, teaching history or grades.</p>
      {retireImpact?<p role="status">
        Dependencies: {retireImpact.courses} active teaching assignments;
        {" "}{retireImpact.schedules} future classes;
        {" "}{retireImpact.projects} active projects;
        {" "}{retireImpact.otherRoles?"other membership roles remain":"no other roles"}.
      </p>:null}
      {retireImpact&&!retireImpact.canEnd?<p role="alert" className="text-error">
        Retirement is blocked until assignments and other roles are resolved.
      </p>:null}
      {error?<p role="alert" className="text-error">{error}</p>:null}
    </div>
  </ConfirmDialog>
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
