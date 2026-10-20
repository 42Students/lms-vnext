"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Status="ACTIVE"|"SUSPENDED"|"ENDED";
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
 return <div className="space-y-2 print:hidden">
  {status==="ACTIVE"?<>
   <Button variant="secondary" type="button" onClick={()=>setOpen(current=>!current)} disabled={busy}
    className="min-h-11 md:min-h-9">Suspend</Button>
   {open?<div className="space-y-2">
    <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold text-body">Reason for suspension
     <Textarea value={reason} maxLength={1000} rows={2}
      onChange={event=>setReason(event.target.value)}
      className="min-h-11 w-full md:min-h-9"/>
    </label>
    <p className="text-xs text-muted-foreground">Suspends only this college membership. Other college access is unaffected.</p>
    <Button variant="primary" type="button" disabled={busy||reason.trim().length<3} onClick={()=>setConfirming("SUSPEND")}
     className="min-h-11 md:min-h-9">Confirm suspension</Button>
   </div>:null}
  </>:status==="SUSPENDED"?<Button variant="secondary" type="button" disabled={busy} onClick={()=>setConfirming("REACTIVATE")}
   className="min-h-11 md:min-h-9">Reactivate</Button>:
    <p className="text-xs text-muted-foreground">Ended membership · read only</p>}
  <ConfirmDialog open={confirming!==null} onOpenChange={value=>{if(!value&&!busy)setConfirming(null);}}
   title={confirming==="SUSPEND"?"Suspend college membership?":"Reactivate college membership?"}
   description={(confirming==="SUSPEND"?"Suspend ":"Reactivate ")+displayName+" in this college?"}
   confirmLabel={confirming==="SUSPEND"?"Suspend membership":"Reactivate membership"}
   confirmVariant={confirming==="SUSPEND"?"danger":"primary"} pending={busy}
   onConfirm={()=>{if(confirming)void change(confirming);}}/>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </div>;
}
