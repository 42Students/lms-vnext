"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
export function MentorTaskDeleteControl({projectId,taskId,title,updatedAt}:{
 projectId:string;taskId:string;title:string;updatedAt:Date|string;
}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState("");
 async function remove(){
  if(pending||!window.confirm('Delete this task?\n'+title+
    '\nThis permanently removes the task from the project board. It cannot be undone.'))return;
  setPending(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+
    encodeURIComponent(taskId),"DELETE",{
     expectedUpdatedAt:new Date(updatedAt).toISOString(),confirm:true,
   });
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not delete this task.");}
  finally{setPending(false);}
 }
 return <span>
  <button type="button" disabled={pending} onClick={()=>void remove()}
    className="min-h-10 rounded-md border border-error px-3 text-xs font-semibold text-error disabled:opacity-50">
    {pending?"Deleting…":"Delete task"}
  </button>
  {error?<span role="alert" className="block text-xs text-error">{error}</span>:null}
 </span>;
}
