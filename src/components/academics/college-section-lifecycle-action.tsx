"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {classLifecyclePrompt} from "@/modules/academics/college-section-lifecycle-model";

export function CollegeSectionLifecycleAction({row}:{
  row:{id:string;name:string;status:"ACTIVE"|"ARCHIVED";updatedAt:string};
}){
  const router=useRouter();
  const [pending,start]=useTransition();
  const [error,setError]=useState("");
  const [confirming,setConfirming]=useState(false);
  const action=row.status==="ACTIVE"?"ARCHIVE":"RESTORE";
  function change(){
    setConfirming(false);
    setError("");
    start(async()=>{
      try{
        await apiFetch("/api/college/classes/"+encodeURIComponent(row.id)+"/lifecycle",{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({action,expectedUpdatedAt:row.updatedAt,confirm:true}),
        });
        router.refresh();
      }catch(reason){setError(reason instanceof Error?reason.message:"We couldn't update this class. Please retry.");}
    });
  }
  return <div className="space-y-1">
    <button type="button" disabled={pending} onClick={()=>setConfirming(true)}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      {pending?"Saving…":action==="ARCHIVE"?"Archive":"Restore"}
    </button>
    <ConfirmDialog open={confirming} onOpenChange={setConfirming}
      title={action==="ARCHIVE"?"Archive class":"Restore class"}
      description={classLifecyclePrompt(row.name,action)}
      confirmLabel={action==="ARCHIVE"?"Archive class":"Restore class"}
      pending={pending} onConfirm={change}/>
    {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  </div>;
}
