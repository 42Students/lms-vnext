"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {learnerRequestCancelPayload} from "@/modules/placements/learner-support-cancel-model";
export function LearnerSupportCancel({requestId,expectedUpdatedAt}:{
  requestId:string;expectedUpdatedAt:string;
}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function confirm(){
    if(pending)return;
    const payload=learnerRequestCancelPayload({requestId,expectedUpdatedAt,
      status:"PENDING",confirmed:true});
    setPending(true);setError(null);
    try{
      const response=await fetch("/api/placements/requests/"+encodeURIComponent(payload.requestId)+"/actions",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:payload.action,expectedUpdatedAt:payload.expectedUpdatedAt}),
      });
      if(!response.ok){
        throw new Error(response.status===409
          ?"This request has changed. Refresh before cancelling."
          :"Unable to cancel this request. It has not been changed.");
      }
      setOpen(false);
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Unable to cancel the request.");}
    finally{setPending(false);}
  }
  return <>
    <Button className="max-md:min-h-11" size="sm" variant="secondary" onClick={()=>{setError(null);setOpen(true);}}>
      Cancel pending request
    </Button>
    <Dialog open={open} onOpenChange={value=>{if(!pending)setOpen(value);}}
      title="Cancel placement request"
      description="Cancel this pending request? The original application, interview or offer will not change."
      footer={<>
        <Button className="max-md:min-h-11" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}>Keep request</Button>
        <Button className="max-md:min-h-11" disabled={pending} onClick={()=>void confirm()}>
          {pending?"Cancelling…":"Confirm cancellation"}
        </Button>
      </>}>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
      <p className="text-sm text-body">
        The placement team will no longer review this request. This action requires the latest request version.
      </p>
    </Dialog>
  </>;
}
