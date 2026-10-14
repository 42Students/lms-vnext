"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {classLifecyclePrompt} from "@/modules/academics/college-section-lifecycle-model";
export function CollegeSectionLifecycleAction({row}:{
  row:{id:string;name:string;status:"ACTIVE"|"ARCHIVED";updatedAt:string};
}){
  const router=useRouter(),[pending,start]=useTransition(),[error,setError]=useState("");
  const action=row.status==="ACTIVE"?"ARCHIVE":"RESTORE";
  function change(){
    if(!window.confirm(classLifecyclePrompt(row.name,action)))return;
    setError("");
    start(async()=>{
      try{
        const response=await fetch("/api/college/classes/"+encodeURIComponent(row.id)+"/lifecycle",{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({action,expectedUpdatedAt:row.updatedAt,confirm:true}),
        });
        if(!response.ok){
          const reason=await response.json().catch(()=>({error:"CLASS_CHANGE_FAILED"})) as {error?:string};
          throw new Error(reason.error??"CLASS_CHANGE_FAILED");
        }
        router.refresh();
      }catch(reason){setError(reason instanceof Error?reason.message:"Class update failed.");}
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
