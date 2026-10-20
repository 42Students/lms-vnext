"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScopedMembershipLifecycleActions({membershipId,displayName,status}:{
 membershipId:string;displayName:string;status:string;
}) {
 const router=useRouter();
 const [reason,setReason]=useState("");
 const [open,setOpen]=useState(false);
 const [confirming,setConfirming]=useState<"SUSPEND"|"REACTIVATE"|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
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
   if(!response.ok)throw new Error(data?.error??"Could not change membership status.");
   setOpen(false);setReason("");setConfirming(null);
   setNotice(action==="SUSPEND"?"College membership suspended.":"College membership reactivated.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update membership");}
  finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-[var(--lms-space-3)] print:hidden">
  {status==="ACTIVE"?<>
   <Button variant="secondary" type="button" onClick={()=>{setError(null);setNotice(null);setOpen(current=>!current);}} disabled={busy}
    className="min-h-11 w-full sm:w-auto md:min-h-9" aria-expanded={open}>Suspend</Button>
   {open?<div role="region" aria-label="Suspend membership" className="min-w-0 space-y-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)]">
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Reason for suspension
     <Textarea value={reason} maxLength={1000} rows={2}
      onChange={event=>setReason(event.target.value)}
      className="min-h-24 w-full"/>
    </label>
    <p className="text-xs text-muted-foreground">Suspends only this college membership. Other college access is unaffected.</p>
    <Button variant="danger" type="button" disabled={busy||reason.trim().length<3} onClick={()=>setConfirming("SUSPEND")}
     className="min-h-11 w-full sm:w-auto md:min-h-9">Confirm suspension</Button>
   </div>:null}
  </>:status==="SUSPENDED"?<Button variant="secondary" type="button" disabled={busy}
   className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>{setError(null);setNotice(null);setConfirming("REACTIVATE");}}>Reactivate</Button>:
    <p className="text-xs text-muted-foreground">Ended membership · read only</p>}
  <ConfirmDialog open={confirming!==null} onOpenChange={value=>{if(!value&&!busy)setConfirming(null);}}
   title={confirming==="SUSPEND"?"Suspend college membership?":"Reactivate college membership?"}
   description={(confirming==="SUSPEND"?"Suspend ":"Reactivate ")+displayName+" in this college?"}
   confirmLabel={confirming==="SUSPEND"?"Suspend membership":"Reactivate membership"}
   confirmVariant={confirming==="SUSPEND"?"danger":"primary"} pending={busy}
   confirmDisabled={confirming==="SUSPEND"&&reason.trim().length<3}
   onConfirm={()=>{if(confirming)void change(confirming);}}>
    {error?<p role="alert" className="break-words border-l-2 border-error bg-error-subtle p-[var(--lms-space-3)] text-sm text-error">{error}</p>:null}
   </ConfirmDialog>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" aria-live="polite" className="text-sm text-success-text">{notice}</p>:null}
 </div>;
}
