"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";

/** SA-tenants-modules-R02: no implicit role/identity/domain resurrection. */
export function TenantRestoreAction({
 kind,id,name,
}:{kind:"organization"|"college";id:string;name:string}){
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 async function restore(){
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
   showToast({tone:"error",title:"Restore failed",
    description:reason instanceof Error?reason.message:"Could not restore this record. Refresh and retry."});
  }
 }
 return <>
  <Button type="button" size="sm" variant="secondary" disabled={pending}
   onClick={()=>setOpen(true)}>Restore {kind}</Button>
  <ConfirmDialog open={open} onOpenChange={setOpen}
   title={"Restore "+name+"?"}
   description={"The archived "+kind+" will become active again. Child accounts, domains, and service readiness are not automatically enabled. Review before allowing access."}
   confirmLabel={"Restore "+kind} pending={pending} onConfirm={()=>void restore()}/>
 </>;
}
