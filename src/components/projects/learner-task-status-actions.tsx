"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function LearnerTaskStatusActions({projectId,task,currentMembershipId}:{
 projectId:string;currentMembershipId:string|null;
 task:{id:string;status:string;updatedAt:Date;assigneeMembershipId:string|null;blockerReason:string|null};
}){
 const router=useRouter();
 const [note,setNote]=useState(task.blockerReason??"");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const mine=Boolean(currentMembershipId&&task.assigneeMembershipId===currentMembershipId);
 const canStart=mine&&(task.status==="TODO"||task.status==="BLOCKED");
 const canBlock=mine&&(task.status==="TODO"||task.status==="IN_PROGRESS");
 async function change(status:"IN_PROGRESS"|"BLOCKED"){
  if(pending)return;
  if(status==="BLOCKED"&&note.trim().length<3){setError("Describe what is blocking this task");return;}
  setPending(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+
     "/tasks/"+encodeURIComponent(task.id)+"/learner-status",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status,expectedUpdatedAt:task.updatedAt.toISOString(),
      ...(status==="BLOCKED"?{blockerReason:note.trim()}:{})}),
   });
   if(!response.ok){setError(response.status===409?
    "The task changed or this action is no longer available. Refresh the Board.":
    "Could not update the task. Check your access and try again.");return;}
   setSuccess(status==="BLOCKED"?"Blocker reported":"Task moved to In Progress");
   router.refresh();
  }catch{setError("Could not update the task. Check your connection and try again.");}
  finally{setPending(false);}
 }
 async function reorder(action:"MOVE_UP"|"MOVE_DOWN"){
  if(pending)return;
  setPending(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+
    "/tasks/"+encodeURIComponent(task.id)+"/learner-progress",{
     method:"PATCH",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({action,expectedUpdatedAt:task.updatedAt.toISOString()}),
   });
   if(!response.ok){setError(response.status===409?
     "The task order changed. Refresh the Board and try again.":
     "This task cannot move further in the current active sprint.");return;}
   setSuccess(action==="MOVE_UP"?"Task moved up.":"Task moved down.");
   router.refresh();
  }catch{setError("Could not reorder the task. Check your connection and retry.");}
  finally{setPending(false);}
 }
 if(!mine)return <p className="mt-3 text-xs text-muted-foreground">Only the assigned learner can update this task.</p>;
 return <section aria-label="My task actions" className="mt-5 space-y-3 border-t border-border pt-4">
  <h3 className="font-semibold">Task actions</h3>
  {task.blockerReason?<p className="text-sm text-body">Blocker: {task.blockerReason}</p>:null}
  {canBlock?<label className="block text-sm text-body">What is blocking this task?
   <Textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000}
    className="mt-1" />
  </label>:null}
  <div className="flex flex-wrap gap-3">
   {canStart?<Button type="button" disabled={pending} onClick={()=>void change("IN_PROGRESS")}
     className="min-h-9">Start work</Button>:null}
   {canBlock?<Button type="button" disabled={pending} onClick={()=>void change("BLOCKED")}
     variant="secondary" className="min-h-9">Report blocker</Button>:null}
  </div>
  {["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)?<div className="flex flex-wrap gap-2" aria-label="Reorder my task">
   <Button type="button" disabled={pending} onClick={()=>void reorder("MOVE_UP")}
    variant="secondary" className="min-h-9">Move up</Button>
   <Button type="button" disabled={pending} onClick={()=>void reorder("MOVE_DOWN")}
    variant="secondary" className="min-h-9">Move down</Button>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {success?<p role="status" className="text-sm text-success">{success}</p>:null}
  <p className="text-xs text-muted-foreground">Submit for review in the project workspace. Only your mentor can complete a task.</p>
 </section>;
}
