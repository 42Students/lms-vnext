"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";

/** SA-tenants-modules-R02: no implicit role/identity/domain resurrection. */
export function TenantRestoreAction({
 kind,id,name,
}:{kind:"organization"|"college";id:string;name:string}){
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [error,setError]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 async function restore(){
  if(pending)return;
  setError("");
  try{
   await run(async()=>{
    const endpoint=kind==="organization"?"organizations":"colleges";
    await apiFetch("/api/"+endpoint+"/"+encodeURIComponent(id)+"/restore",{
     method:"POST",credentials:"same-origin",
    });
    setOpen(false);
    showToast({tone:"success",title:(kind==="college"?"College":"Organization")+" restored",
     description:name+" is active again. Review its modules and runtime readiness before allowing access."});
    router.refresh();
   });
  }catch(reason){
   const message=reason instanceof FriendlyFetchError && reason.status===409
    ?"This record changed or its parent is unavailable. Refresh the archived list before restoring."
    :reason instanceof FriendlyFetchError && reason.status===403
    ?"You no longer have permission to restore this record.":
    "Could not restore this record. Refresh and retry.";
   setError(message);
   showToast({tone:"error",title:"Restore failed",description:message});
  }
 }
 return <section aria-label={"Restore "+kind} aria-busy={pending} className="min-w-0 space-y-2 print:hidden">
  <Button type="button" size="sm" variant="secondary" className="min-h-11 w-full sm:min-h-9 sm:w-auto"
   loading={pending} disabled={pending} onClick={()=>{setError("");setOpen(true);}}>Restore {kind}</Button>
  <ConfirmDialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}
   title={"Restore "+name+"?"}
   description={"The archived "+kind+" will become active again. Child accounts, domains, and service readiness are not automatically enabled. Review before allowing access."}
   confirmLabel={"Restore "+kind} confirmVariant="primary" pending={pending}
   onConfirm={()=>void restore()}>
   <div className="min-w-0 space-y-3">
    <p className="m-0 break-words text-sm leading-5 text-body"><strong className="font-semibold text-foreground">{name}</strong> will become active again.</p>
    <p className="m-0 break-words text-xs leading-5 text-muted-foreground">Child accounts, domains and runtime readiness still need review before access is allowed.</p>
    {error?<Alert tone="error">{error}</Alert>:null}
   </div>
  </ConfirmDialog>
  {error&&!open?<Alert tone="error">{error}</Alert>:null}
 </section>;
}
