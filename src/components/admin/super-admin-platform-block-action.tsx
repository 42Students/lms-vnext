"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import {friendlyApiError} from "@/lib/friendly-error";
export function SuperAdminPlatformBlockAction({userId,status}:{userId:string;status:"ACTIVE"|"DISABLED"}){
 const router=useRouter();
 const lock=useRef(false);
 const [reason,setReason]=useState("");
 const [pending,setPending]=useState(false);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 async function submit(){
  if(lock.current||reason.trim().length<4)return;
  const next=status==="ACTIVE"?"DISABLED":"ACTIVE";
  lock.current=true;setPending(true);setError(null);setNotice(null);
  try{
   const result=await apiFetch<{userId:string;status:string;changed:boolean}>(
     "/api/admin/people/platform/"+encodeURIComponent(userId),{
     method:"PATCH",headers:{"content-type":"application/json"},
     body:JSON.stringify({status:next,reason:reason.trim(),confirmed:true}),
   });
   if(result.userId!==userId||result.status!==next)throw new Error("Account status could not be confirmed. Refresh before retrying.");
   setNotice(next==="DISABLED"?"Platform account blocked and sessions revoked.":"Platform account reactivated.");
   setReason("");setConfirmOpen(false);
   router.refresh();
  }catch{setError(friendlyApiError({}));}
  finally{lock.current=false;setPending(false);}
 }
 return <section aria-label="Platform account control" className="border-b border-border pb-5 print:hidden">
  <h2 className="font-semibold">Platform-wide account access</h2>
  <p className="mt-1 text-sm text-body">Unlike college suspension, a platform block prevents login across every college. This action requires an audit reason.</p>
  <label className="mt-3 grid gap-1 text-sm font-semibold text-body">Reason
   <Textarea value={reason} maxLength={1000} rows={2} disabled={pending}
    onChange={event=>setReason(event.target.value)} className="min-h-11 w-full md:min-h-9"/>
  </label>
  <Button type="button" variant={status==="ACTIVE"?"danger":"secondary"} disabled={pending||reason.trim().length<4}
   onClick={()=>setConfirmOpen(true)} className="mt-3 min-h-11 md:min-h-9">
   {pending?"Updating…":status==="ACTIVE"?"Block platform account":"Reactivate platform account"}
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={open=>{if(!pending)setConfirmOpen(open);}}
   title={status==="ACTIVE"?"Block platform account?":"Reactivate platform account?"}
   description={status==="ACTIVE"?"Block this person across the platform? All active sessions will be revoked immediately.":"Reactivate this platform account? The person must sign in again."}
   confirmLabel={status==="ACTIVE"?"Block platform account":"Reactivate platform account"}
   confirmVariant={status==="ACTIVE"?"danger":"primary"} pending={pending}
   onConfirm={()=>void submit()}/>
  {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="mt-2 text-sm text-body">{notice}</p>:null}
 </section>;
}
