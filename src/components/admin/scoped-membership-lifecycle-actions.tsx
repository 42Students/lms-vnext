"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
   <Button variant="secondary" type="button" onClick={()=>setOpen(current=>!current)} disabled={busy}
    className="">Suspend</Button>
   {open?<div className="space-y-2">
    <label className="grid gap-1 text-xs font-semibold text-body">Reason for suspension
     <Textarea value={reason} maxLength={1000} rows={2}
      onChange={event=>setReason(event.target.value)}
      className="w-full"/>
    </label>
    <p className="text-xs text-muted-foreground">Suspends only this college membership. Other college access is unaffected.</p>
    <Button variant="primary" type="button" disabled={busy||reason.trim().length<3} onClick={()=>void change("SUSPEND")}
     className="">Confirm suspension</Button>
   </div>:null}
  </>:status==="SUSPENDED"?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void change("REACTIVATE")}
   className="">Reactivate</Button>:
    <p className="text-xs text-muted-foreground">Ended membership · read only</p>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </div>;
}
