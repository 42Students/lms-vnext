"use client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";

export function CollegeAdminLifecycleAction({membershipId,status,hasMentorRole,displayName}:{
 membershipId:string;status:string;hasMentorRole:boolean;displayName?:string;
}){
 const router=useRouter(),{showToast}=useToast();
 const [reason,setReason]=useState("");
 const {run,pending:busy}=useGuardedAction();
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [chosenAction,setChosenAction]=useState<"SUSPEND"|"REACTIVATE"|"END"|null>(null);
 const [error,setError]=useState("");
 const defaultAction=status==="ACTIVE"?"SUSPEND":"REACTIVATE";
 const action=chosenAction??defaultAction;
 const person=displayName?.trim()||"this administrator";
 async function submit(){
  if(busy||(action==="SUSPEND"&&reason.trim().length<3))return;
  setError("");
  try{
   await run(async()=>{
    await apiFetch("/api/people/"+encodeURIComponent(membershipId)+"/lifecycle",{
     method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify(action==="SUSPEND"?{action,reason:reason.trim()}:{action}),
    });
    setReason("");setConfirmOpen(false);setChosenAction(null);
    showToast({tone:"success",title:action==="SUSPEND"
     ?"Admin suspended. Their existing sessions were invalidated.":action==="REACTIVATE"
      ?"Admin reactivated.":"Administrator membership ended. Audit history retained."});
    router.refresh();
   });
  }catch(cause){
    const prefix=action==="SUSPEND"?"Admin was not suspended":action==="REACTIVATE"
      ?"Admin was not reactivated":"Administrator membership was not ended";
    const detail=cause instanceof Error?cause.message:"Please retry the operation.";
    setError(prefix+". "+(detail.includes("FACULTY_HAS_ACTIVE_PROJECTS")
     ?"Finish or reassign active project work before changing access.":detail));
  }
 }
 if(status!=="ACTIVE"&&status!=="SUSPENDED")return null;
 const reasonIssue=action==="SUSPEND"&&reason.trim().length>0&&reason.trim().length<3;
 return <section aria-label="Administrator access" aria-busy={busy} className="min-w-0 space-y-3 print:hidden">
  {hasMentorRole&&status==="ACTIVE"?<Alert tone="warning">This administrator also mentors projects. Suspension is allowed only if no active project assignments remain; the server checks before changing access.</Alert>:null}
  <div className="flex min-w-0 flex-wrap items-center gap-3">
   <Button type="button" variant="secondary" role="switch"
    aria-label={"Enabled for "+person} aria-checked={status==="ACTIVE"} disabled={busy}
    onClick={()=>{setError("");setChosenAction(defaultAction);setConfirmOpen(true);}}
    className="min-h-11 gap-2 md:min-h-9">
    <span aria-hidden="true" className={"inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors "+(status==="ACTIVE"?"bg-[var(--lms-primary)]":"bg-[var(--lms-neutral-300)]")}>
     <span className={"h-4 w-4 rounded-full bg-white transition-transform "+(status==="ACTIVE"?"translate-x-4":"translate-x-0")}/>
    </span>
    {status==="ACTIVE"?"Enabled":"Suspended"}
   </Button>
   <span className="text-xs text-muted-foreground">
    {status==="ACTIVE"?"Disable access and revoke sessions":"Restore this administrator's access"}
   </span>
  </div>
  {status==="SUSPENDED"?<div className="flex flex-wrap items-center gap-3">
    <Button type="button" variant="danger" disabled={busy} onClick={()=>{
      setError("");setChosenAction("END");setConfirmOpen(true);
    }}>End membership</Button>
    <p className="m-0 text-xs text-muted-foreground">Permanently ends this college membership; its audit and project history are retained. Active project assignments block the change.</p>
   </div>:null}
  {error?<Alert tone="error">{error}<Button type="button" size="sm" variant="secondary"
    disabled={busy} onClick={()=>void submit()} className="ml-2 min-h-11 md:min-h-9">Retry {action==="SUSPEND"?"suspension":action==="REACTIVATE"?"reactivation":"membership end"}</Button></Alert>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!busy){setConfirmOpen(next);if(!next)setChosenAction(null);}}}
   title={action==="SUSPEND"?"Suspend "+person+"?":action==="REACTIVATE"?"Reactivate "+person+"?":"Permanently end "+person+"'s membership?"}
   description={action==="SUSPEND"?person+" will lose college access immediately. Every current session will be invalidated and active devices signed out.":action==="REACTIVATE"?"Restore college access for "+person+"?":"This membership cannot be reactivated. Existing sessions are revoked, while audit and project records remain. Active project assignments block the change."}
   confirmLabel={action==="SUSPEND"?"Suspend":action==="REACTIVATE"?"Reactivate":"End membership"} confirmVariant={action==="REACTIVATE"?"primary":"danger"}
   pending={busy} confirmDisabled={action==="SUSPEND"&&reason.trim().length<3}
   onConfirm={()=>void submit()}>
   {action==="SUSPEND"?<label className="grid min-w-0 gap-1.5 text-sm font-semibold text-body">
     Suspension reason (required)
     <Input value={reason} maxLength={1000} disabled={busy} aria-invalid={reasonIssue}
      aria-describedby="admin-suspension-reason-help" placeholder="Reason for suspension"
      onChange={event=>{setReason(event.target.value);if(error)setError("");}}/>
     <span id="admin-suspension-reason-help" className={"text-xs font-normal "+(reasonIssue?"text-error":"text-muted-foreground")}>
      {reasonIssue?"Enter at least 3 characters before suspending.":"At least 3 characters required · "+reason.length+"/1000"}
     </span>
   </label>:null}
  </ConfirmDialog>
 </section>;
}
