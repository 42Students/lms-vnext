"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
export function MentorTaskDeleteControl({projectId,taskId,title,updatedAt}:{
 projectId:string;taskId:string;title:string;updatedAt:Date|string;
}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 async function remove(){
  if(pending)return;
  setPending(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+
    encodeURIComponent(taskId),"DELETE",{
     expectedUpdatedAt:new Date(updatedAt).toISOString(),confirm:true,
   });
   setConfirmOpen(false);router.refresh();
  }catch{setError("Could not delete this task. Please try again.");}
  finally{setPending(false);}
 }
 return <span>
  <button type="button" disabled={pending} onClick={()=>setConfirmOpen(true)}
    className="min-h-10 rounded-md border border-error px-3 text-xs font-semibold text-error disabled:opacity-50">
    {pending?"Deleting…":"Delete task"}
  </button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
   title="Delete this task?" confirmLabel="Delete task" pending={pending} onConfirm={remove}
   description="This permanently removes the task from the project board. It cannot be undone.">
   <p className="break-words text-sm font-semibold text-foreground">{title}</p>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </ConfirmDialog>
 </span>;
}
