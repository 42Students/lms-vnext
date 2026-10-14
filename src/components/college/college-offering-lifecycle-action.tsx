"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {offeringLifecycleConfirmation} from "@/modules/courses/college-offering-lifecycle-model";
export function CollegeOfferingLifecycleAction({id,name,status}:{
  id:string;name:string;status:"ACTIVE"|"ARCHIVED";
}) {
  const router=useRouter(); const [pending,startTransition]=useTransition(); const [error,setError]=useState("");
  const action=status==="ACTIVE"?"ARCHIVE":"RESTORE";
  function submit() {
    if (!window.confirm(offeringLifecycleConfirmation(name,action))) return;
    setError("");
    startTransition(async()=>{
      try {
        const response=await fetch("/api/college/offerings/"+encodeURIComponent(id)+"/lifecycle",{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({action,expectedStatus:status,confirm:true}),
        });
        if (!response.ok) throw new Error("Offering lifecycle blocked: check dependencies or refresh the list.");
        router.refresh();
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Update failed"); }
    });
  }
  return <div className="space-y-1">
    <button type="button" disabled={pending} onClick={submit}
      className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-primary-text">
      {pending?"Saving…":action==="ARCHIVE"?"Archive":"Restore"}
    </button>
    {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  </div>;
}
