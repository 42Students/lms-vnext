"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
export function MentorSprintDeleteControl({projectId,sprintId,title,taskCount,updatedAt}:{
 projectId:string;sprintId:string;title:string;taskCount:number;updatedAt:string;
}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function remove(){
  if(busy||!window.confirm('Delete sprint "'+title+'"? '+taskCount+
    ' task(s) will return to the product backlog. This cannot be undone.'))return;
  setBusy(true);setError("");
  try{
   const result=await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
    "/sprints/"+encodeURIComponent(sprintId),"DELETE",{
     expectedUpdatedAt:updatedAt,confirmUnlink:true,
   }) as {deleted:boolean;unlinkedTasks:number};
   if(!result.deleted)throw Error("Sprint could not be deleted.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to delete sprint.");}
  finally{setBusy(false);}
 }
 return <span className="inline-flex flex-col gap-1">
  <button type="button" disabled={busy}
   onClick={()=>void remove()} className="min-h-10 rounded-md border border-error px-3 text-xs font-semibold text-error">
   {busy?"Deleting…":"Delete sprint"}
  </button>
  {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </span>;
}
