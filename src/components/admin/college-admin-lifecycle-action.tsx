"use client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useGuardedAction} from "@/hooks/use-guarded-action";

export function CollegeAdminLifecycleAction({membershipId,status,hasMentorRole}:{
 membershipId:string;status:string;hasMentorRole:boolean;
}){
 const router=useRouter();
 const [reason,setReason]=useState("");
 const {run,pending:busy}=useGuardedAction();
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [error,setError]=useState("");
 const action=status==="ACTIVE"?"SUSPEND":"REACTIVATE";
 async function submit(){
  if(busy||(action==="SUSPEND"&&hasMentorRole)||(action==="SUSPEND"&&reason.trim().length<3))return;
  setError("");
  try{
   await run(async()=>{
    await apiFetch("/api/people/"+encodeURIComponent(membershipId)+"/lifecycle",{
     method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify(action==="SUSPEND"?{action,reason:reason.trim()}:{action}),
    });
    setReason("");setConfirmOpen(false);router.refresh();
   });
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to change access");}
 }
 if(status!=="ACTIVE"&&status!=="SUSPENDED")return null;
 if(hasMentorRole&&action==="SUSPEND")return <Alert tone="warning">Also assigned to mentoring. Review active project assignments before changing access.</Alert>;
 const reasonIssue=action==="SUSPEND"&&reason.trim().length>0&&reason.trim().length<3;
 return <section aria-label="Administrator access" aria-busy={busy} className="min-w-0 space-y-3 print:hidden">
  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
   {action==="SUSPEND"?<label className="grid min-w-0 gap-1.5 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Suspension reason
    <Input value={reason} maxLength={1000} disabled={busy} aria-invalid={reasonIssue}
     aria-describedby="admin-suspension-reason-help"
     onChange={event=>{setReason(event.target.value);if(error)setError("");}}
     className="min-h-11 w-full sm:min-h-9" placeholder="Reason for suspension"/>
    <span id="admin-suspension-reason-help" className={reasonIssue?"text-xs font-normal leading-5 text-[var(--lms-error)]":"text-xs font-normal leading-5 text-muted-foreground"}>
     {reasonIssue?"Enter at least 3 characters before suspending.":"At least 3 characters required · "+reason.length+"/1000"}
    </span>
   </label>:<p className="m-0 min-w-0 text-sm leading-5 text-body">Restore this administrator&apos;s college access.</p>}
   <Button type="button" variant={action==="SUSPEND"?"danger":"primary"} loading={busy}
    disabled={busy||(action==="SUSPEND"&&reason.trim().length<3)}
    onClick={()=>{setError("");setConfirmOpen(true);}} className="min-h-11 w-full sm:min-h-9 sm:w-auto">
    {busy?"Saving…":action==="SUSPEND"?"Suspend":"Reactivate"}
   </Button>
  </div>
  {error?<Alert tone="error">{error}</Alert>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!busy)setConfirmOpen(next);}}
   title={action==="SUSPEND"?"Suspend administrator access?":"Reactivate administrator access?"}
   description={action==="SUSPEND"?"This administrator will lose college access and be signed out from active devices.":"Restore college access for this administrator?"}
   confirmLabel={action==="SUSPEND"?"Suspend":"Reactivate"} confirmVariant={action==="SUSPEND"?"danger":"primary"}
   pending={busy} confirmDisabled={action==="SUSPEND"&&reason.trim().length<3}
   onConfirm={()=>void submit()}>
   {action==="SUSPEND"?<p className="min-w-0 break-words text-sm leading-5 text-body"><strong className="font-semibold">Suspension reason:</strong> {reason.trim()}</p>:null}
  </ConfirmDialog>
 </section>;
}
