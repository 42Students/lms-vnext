"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";

/** Selected Mentor calendar cancellation reuses the audited, version-checked
 * meeting decision transaction. A cancelled meeting is not silently erased.
 */
export function MentorMeetingCancelInline(props:{
  projectId:string;meetingId:string;expectedUpdatedAt:string;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState(false);
  const [note,setNote]=useState("");
  const [error,setError]=useState<string|null>(null);

  async function cancel(){
    if(pending)return;
    setPending(true);setError(null);
    try{
      await projectMutation(
        "/api/projects/"+encodeURIComponent(props.projectId)+
          "/meetings/"+encodeURIComponent(props.meetingId)+"/mentor-decision",
        "POST",{
          action:"CANCEL",confirmed:true,
          expectedUpdatedAt:props.expectedUpdatedAt,
          ...(note.trim()?{note:note.trim()}:{}),
        },
      );
      setOpen(false);setNote("");
      showToast({tone:"success",title:"Meeting cancelled",
        description:"The cancellation is recorded. Active project members receive an in-app update."});
      router.refresh();
    }catch{
      setError("Meeting not cancelled. Its status or version may have changed. Refresh and retry.");
    }finally{setPending(false);}
  }

  return <>
    <Button type="button" size="sm" variant="secondary" disabled={pending}
      onClick={()=>{setError(null);setOpen(true);}}>
      Cancel meeting
    </Button>
    <ConfirmDialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}
      title="Cancel this meeting?" confirmLabel="Confirm cancellation"
      description="Cancellation is permanent for this meeting record. Project members receive an in-app notification; this does not cancel any external calendar invite."
      pending={pending} onConfirm={()=>void cancel()}>
      <label className="block text-sm">
        Note to the team (optional)
        <Textarea maxLength={2000} rows={3} disabled={pending}
          value={note} onChange={event=>setNote(event.target.value)}
          placeholder="Reason for cancelling"/>
      </label>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
  </>;
}
