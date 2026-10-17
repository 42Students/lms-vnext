"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { allowedMentorTaskTransition } from "@/modules/projects/mentor-task-transition-model";
const options=["TODO","IN_PROGRESS","BLOCKED"] as const;
export function MentorTaskStatusTransition(props:{
  projectId:string;taskId:string;status:string;sprintStatus:string;updatedAt:string;
  blockerReason?:string|null;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [selected,setSelected]=useState<string>(props.status);
  const [confirm,setConfirm]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const valid=allowedMentorTaskTransition(props.status,selected);
  if(props.sprintStatus!=="ACTIVE"||!options.some(x=>x===props.status))return null;
  async function submit(){
    const blockerReason=selected==="BLOCKED"&&!props.blockerReason?.trim()
      ? window.prompt("What's blocking this task?")?.trim() : undefined;
    if(selected==="BLOCKED"&&!props.blockerReason?.trim()&&!blockerReason)return;
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(props.projectId)+
        "/tasks/"+encodeURIComponent(props.taskId)+"/mentor-transition","PATCH",{
          status:selected,expectedUpdatedAt:props.updatedAt,confirmed:true,
          ...(blockerReason?{blockerReason}:{}),
        });
      setConfirm(false);
      showToast({tone:"success",title:"Task status recorded"});
      router.refresh();
    }catch(caught){
      const message=caught instanceof Error?caught.message:"Status change failed";
      setError(message);
      showToast({tone:"error",title:"Task transition rejected",description:message});
    }finally{setPending(false);}
  }
  return <>
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-semibold text-body">Task state
        <select aria-label="Next task state" value={selected}
          onChange={event=>{setSelected(event.target.value);setError(null);}}
          disabled={pending} className="min-h-10 rounded-md border border-border bg-surface px-3">
          {options.map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
        </select>
      </label>
      <Button variant="secondary" size="sm" disabled={!valid||pending}
        onClick={()=>{setError(null);setConfirm(true);}}>Review status change</Button>
    </div>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm}
      title="Change this task state?" confirmLabel="Confirm status change"
      description={"Change status from "+props.status.replaceAll("_"," ")+" to "+
        selected.replaceAll("_"," ")+". Completion still requires approved review."}
      pending={pending} onConfirm={submit}>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
  </>;
}
