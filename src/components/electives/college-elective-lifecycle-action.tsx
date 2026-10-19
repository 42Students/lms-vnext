"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {electiveLifecyclePrompt} from "@/modules/electives/college-elective-lifecycle-model";
import {friendlyApiError} from "@/lib/friendly-error";
export function CollegeElectiveLifecycleAction({slotId,name,status,version}:{
  slotId:string;name:string;status:string;version:number;
}){
  const router=useRouter();
  const [pending,start]=useTransition(),[error,setError]=useState("");
  const inFlightRef=useRef(false);
  const action=status==="ACTIVE"?"ARCHIVE":"RESTORE";
  function change(){
    if(inFlightRef.current||pending)return;
    if(!window.confirm(electiveLifecyclePrompt(name,action)))return;
    inFlightRef.current=true;
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
      finally{inFlightRef.current=false;}
    });
  }
  return <div className="space-y-1">
    <Button variant="secondary" type="button" disabled={pending} onClick={change}
      className="text-primary-text">
      {pending?"Saving…":action==="ARCHIVE"?"Archive":"Restore"}
    </Button>
    {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  </div>;
}
