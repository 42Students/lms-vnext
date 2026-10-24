"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {mentorCriteriaLines,toggleMentorCriterion} from
 "@/modules/projects/mentor-task-criteria-model";

export function MentorTaskCriteriaChecklist({projectId,task,editable}:{
 projectId:string;editable:boolean;
 task:{id:string;title:string;description:string|null;
  acceptanceCriteria:string|null;priority:string;updatedAt:Date};
}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const lines=mentorCriteriaLines(task.acceptanceCriteria);
 async function toggle(index:number){
  if(!editable||busy)return;
  const next=toggleMentorCriterion(task.acceptanceCriteria,index);
  if(next===null||next===task.acceptanceCriteria)return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
     "/tasks/"+encodeURIComponent(task.id)+"/details","PATCH",{
     title:task.title,description:task.description,
     acceptanceCriteria:next,priority:task.priority,
     expectedUpdatedAt:new Date(task.updatedAt).toISOString(),
   });
   router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:
     "The criterion could not be saved. Reload the latest task.");
  }finally{setBusy(false);}
 }
 return <div className="prototype-mentor-board-detail-block">
  <h4>Acceptance criteria</h4>
  {lines.length?<ul className="space-y-2">
   {lines.map(line=><li key={line.index}>
     {line.checkable?<label className="flex items-start gap-2">
       <input type="checkbox" checked={line.checked}
         disabled={!editable||busy}
         onChange={()=>void toggle(line.index)}
         aria-label={"Criterion "+(line.index+1)+": "+line.text}
         className="mt-1"/>
       <span>{line.text}</span>
     </label>:<span>{line.text}</span>}
   </li>)}
  </ul>:<p>No acceptance criteria recorded.</p>}
  {!editable&&lines.some(line=>line.checkable)?
   <p className="text-xs text-muted-foreground">
    Only an authorized Mentor can update these saved checklist markers
    while the task is editable.
   </p>:null}
  {error?<p role="alert">{error}</p>:null}
 </div>;
}
