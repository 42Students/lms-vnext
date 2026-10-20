"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
export function MentorTaskDeleteControl({projectId,taskId,title,updatedAt}:{
 projectId:string;taskId:string;title:string;updatedAt:Date|string;
}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState("");
 const {showToast}=useToast();
 const [confirmOpen,setConfirmOpen]=useState(false);
 async function remove(){
  if(pending)return;
  setPending(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+
    encodeURIComponent(taskId),"DELETE",{
     expectedUpdatedAt:new Date(updatedAt).toISOString(),confirm:true,
   });
   setConfirmOpen(false);
   showToast({tone:"success",title:"Task deleted."});
   router.refresh();
  }catch{setError("Could not delete this task. Please try again.");}
  finally{setPending(false);}
 }
 return <>
  <span className="inline-flex min-w-0 max-w-full">
  <Button variant="link" type="button" disabled={pending} onClick={()=>{setError("");setConfirmOpen(true);}}
    className="min-h-11 max-w-full !justify-start !px-1 !text-[var(--lms-error)] md:min-h-9">
    {pending?"Deleting…":"Delete task"}
  </Button>
  </span>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!pending)setConfirmOpen(next);}}
   title="Delete this task?" confirmLabel="Delete task" pending={pending} onConfirm={remove}
   description="This permanently removes the task from the project board. It cannot be undone.">
   <div className="min-w-0 space-y-3">
     <p className="break-words text-sm font-semibold text-foreground">{title}</p>
     {error?<p role="alert" className="break-words text-sm text-error">{error}</p>:null}
   </div>
  </ConfirmDialog>
 </>;
}
