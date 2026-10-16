"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Status="ACTIVE"|"SUSPENDED"|"ENDED";
export function ScopedMembershipLifecycleActions({membershipId,displayName,status}:{
 membershipId:string;displayName:string;status:string;
}) {
 const router=useRouter();
 const [reason,setReason]=useState("");
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 async function change(action:"SUSPEND"|"REACTIVATE") {
  if(busy)return;
  if(action==="SUSPEND"&&reason.trim().length<3){setError("Enter a reason of at least 3 characters.");return;}
  if(!window.confirm((action==="SUSPEND"?"Suspend ":"Reactivate ")+displayName+" in this college?"))return;
  setBusy(true);setError(null);setNotice(null);
  try{
   const response=await fetch("/api/people/"+encodeURIComponent(membershipId)+"/lifecycle",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify(action==="SUSPEND"?{action,reason:reason.trim()}:{action}),
   });
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(data?.error??"Could not change membership status.");
   setOpen(false);setReason("");
   setNotice(action==="SUSPEND"?"College membership suspended.":"College membership reactivated.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update membership");}
  finally{setBusy(false);}
 }
 return <div className="space-y-2">
  {status==="ACTIVE"?<>
   <button type="button" onClick={()=>setOpen(current=>!current)} disabled={busy}
    className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Suspend</button>
   {open?<div className="space-y-2">
    <label className="grid gap-1 text-xs font-semibold text-body">Reason for suspension
     <textarea value={reason} maxLength={1000} rows={2}
      onChange={event=>setReason(event.target.value)}
      className="w-full rounded-md border border-border bg-surface p-2 text-foreground"/>
    </label>
    <p className="text-xs text-muted-foreground">Suspends only this college membership. Other college access is unaffected.</p>
    <button type="button" disabled={busy||reason.trim().length<3} onClick={()=>void change("SUSPEND")}
     className="min-h-10 rounded-md bg-primary px-3 text-sm font-semibold text-on-primary disabled:opacity-50">Confirm suspension</button>
   </div>:null}
  </>:status==="SUSPENDED"?<button type="button" disabled={busy} onClick={()=>void change("REACTIVATE")}
   className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Reactivate</button>:
    <p className="text-xs text-muted-foreground">Ended membership · read only</p>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </div>;
}
