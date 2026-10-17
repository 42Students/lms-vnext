"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {electiveLifecyclePrompt} from "@/modules/electives/college-elective-lifecycle-model";
import {friendlyApiError} from "@/lib/friendly-error";
export function CollegeElectiveLifecycleAction({slotId,name,status,version}:{
  slotId:string;name:string;status:string;version:number;
}){
  const router=useRouter();
  const [pending,start]=useTransition(),[error,setError]=useState("");
  const action=status==="ACTIVE"?"ARCHIVE":"RESTORE";
  function change(){
    if(!window.confirm(electiveLifecyclePrompt(name,action)))return;
    setError("");
    start(async()=>{
      try{
        const res=await fetch("/api/academics/elective-slots/"+encodeURIComponent(slotId)+"/lifecycle",{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({action,expectedVersion:version,confirm:true}),
        });
        if(!res.ok){
          const body=await res.json().catch(()=>({error:"ELECTIVE_LIFECYCLE_FAILED"})) as {error?:string};
          throw new Error(friendlyApiError({status:res.status,code:body.error}));
        }
        router.refresh();
      }catch(err){setError(err instanceof Error?err.message:"Could not change slot");}
    });
  }
  return <div className="space-y-1">
    <button type="button" disabled={pending} onClick={change}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      {pending?"Saving…":action==="ARCHIVE"?"Archive":"Restore"}
    </button>
    {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  </div>;
}
