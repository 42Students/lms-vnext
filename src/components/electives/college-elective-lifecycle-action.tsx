"use client";
import { Button } from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {electiveLifecyclePrompt} from "@/modules/electives/college-elective-lifecycle-model";
import {friendlyApiError} from "@/lib/friendly-error";
import {useToast} from "@/components/ui/toast";
export function CollegeElectiveLifecycleAction({slotId,name,status,version}:{
  slotId:string;name:string;status:string;version:number;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [success,setSuccess]=useState("");
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [pending,start]=useTransition(),[error,setError]=useState("");
  const inFlightRef=useRef(false);
  const action=status==="ACTIVE"?"ARCHIVE":"RESTORE";
  function change(){
    if(inFlightRef.current||pending)return;
    setConfirmOpen(false);
    inFlightRef.current=true;
    setError("");
    setSuccess("");
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
        const title=name+(action==="ARCHIVE"?" archived":" restored");
        setSuccess(title);
        showToast({tone:"success",title});
        router.refresh();
      }catch(err){setError(err instanceof Error?err.message:"Could not change slot");}
      finally{inFlightRef.current=false;}
    });
  }
  return <div className="space-y-1">
    <Button variant="secondary" type="button" disabled={pending} onClick={()=>setConfirmOpen(true)}
      className="text-primary-text">
      {pending?"Saving…":action==="ARCHIVE"?"Archive":"Restore"}
    </Button>
    {success?<p role="status" className="text-xs text-success">{success}</p>:null}
    {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
    <ConfirmDialog open={confirmOpen}
      onOpenChange={open=>{if(!pending)setConfirmOpen(open);}}
      title={action==="ARCHIVE"?"Archive this slot?":"Restore this slot?"}
      description={action==="ARCHIVE"?
        "All its offerings are archived; enrolled students lose access, history is kept.":
        electiveLifecyclePrompt(name,action)}
      confirmVariant={action==="ARCHIVE"?"danger":"primary"}
      confirmLabel={action==="ARCHIVE"?"Archive slot":"Restore slot"}
      pending={pending} onConfirm={change}/>
  </div>;
}
