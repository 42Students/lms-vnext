"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {projectMutation} from "./project-api";
import {mentorPullEligible,mentorPullSelectedPoints} from "@/modules/projects/mentor-sprint-backlog-pull-model";

export type MentorSprintBacklogChoice={
 id:string;title:string;status:string;updatedAt:string;estimatePoints:number|null;
};
/** Follow-up after a confirmed sprint create. Task moves are independent
 * row-version-checked writes; never represent multiple moves as atomic.
 */
export function MentorSprintBacklogPull({projectId,sprintId,sprintTitle,
 tasks,canPull=true}:{
 projectId:string;sprintId:string;sprintTitle:string;
 tasks:readonly MentorSprintBacklogChoice[];canPull?:boolean;
}){
 const router=useRouter();
 const planned=mentorPullEligible(tasks);
 const eligible=planned.candidates;
 const [selected,setSelected]=useState<string[]>([]);
 const [moved,setMoved]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [failed,setFailed]=useState<string[]>([]);
 const remaining=eligible.filter(task=>!moved.includes(task.id));
 const selectedRows=remaining.filter(task=>selected.includes(task.id));
 const totals=mentorPullSelectedPoints(selectedRows,selected);
 async function pull(){
  if(busy||!canPull||!selectedRows.length)return;
  if(!window.confirm("Move "+selectedRows.length+" backlog task"+
    (selectedRows.length===1?"":"s")+" to "+sprintTitle+
    "? Each task is saved separately."))return;
  setBusy(true);setNotice("");setFailed([]);
  const successes:string[]=[],errors:string[]=[];
  for(const task of selectedRows){
   try{
    const result=await projectMutation(
      "/api/projects/"+encodeURIComponent(projectId)+"/backlog","PATCH",{
       taskId:task.id,targetSprintId:sprintId,
       expectedUpdatedAt:task.updatedAt,
    }) as {task?:{id:string;sprintId:string|null}};
    if(result.task?.id!==task.id||result.task.sprintId!==sprintId)
      throw Error("The task move receipt did not confirm its sprint.");
    successes.push(task.id);
   }catch{errors.push(task.id);}
  }
  setMoved(old=>[...new Set([...old,...successes])]);
  setSelected(old=>old.filter(id=>!successes.includes(id)));
  setFailed(errors);
  setNotice(successes.length+" of "+selectedRows.length+
    " selected tasks moved. "+
    (errors.length?errors.length+" failed or became stale; reload the latest Board before retrying.":
      "All selected tasks saved. The Board now has their updated sprint."));
  setBusy(false);
  router.refresh();
 }
 const base="/mentor/projects/"+encodeURIComponent(projectId)+
   "?tab=board&scope=all&lane=BACKLOG";
 return <section aria-label={"Plan backlog work for "+sprintTitle}
   className="my-3 space-y-3 rounded-lg border border-border p-4">
   <h3 className="font-semibold">{sprintTitle} created · plan its backlog work</h3>
   {!canPull?<p>Project tasks can be pulled only while the project is active.
      The sprint itself has been saved.</p>:<>
     <p>Select the existing backlog tasks to pull into the new sprint.
       Each move checks the current task version; earlier successful moves
       remain saved if a later one fails.</p>
     {remaining.length?<ul className="max-h-64 space-y-2 overflow-y-auto">
       {remaining.map(task=><li key={task.id}>
         <label className="flex min-h-10 items-start gap-2">
           <input type="checkbox" className="mt-1" disabled={busy}
             checked={selected.includes(task.id)}
             onChange={event=>setSelected(old=>event.target.checked?
               [...old,task.id]:old.filter(id=>id!==task.id))}/>
           <span>{task.title}
             <small className="ml-2 text-muted-foreground">
               {task.estimatePoints??"Unestimated"} points ·
               {" "}{task.status.replaceAll("_"," ")}
             </small>
             {failed.includes(task.id)?<small className="block text-error">
               Not moved · task may have changed</small>:null}
           </span>
         </label>
       </li>)}
     </ul>:<p>No eligible backlog tasks in the loaded project workspace.</p>}
     {planned.moreEligible>0?<p className="text-xs text-muted-foreground">
       {planned.moreEligible} additional eligible backlog tasks are available on the Board.
       Pull them there or reload this planner after the first batch.</p>:null}
     {planned.excluded>0?<p className="text-xs text-muted-foreground">
       {planned.excluded} unavailable, repeated or review-complete task entries were excluded.
     </p>:null}
     {selectedRows.length?<p>{totals.count} chosen ·
       {" "}{totals.points} currently estimated points
       {totals.unestimated>0?" · "+totals.unestimated+" unestimated":""}
     </p>:null}
     <Button type="button" size="sm" disabled={busy||!selectedRows.length}
       loading={busy} onClick={()=>void pull()}>Pull selected into sprint</Button>
   </>}
   {notice?<p role="status">{notice}</p>:null}
   <Link className="inline-flex min-h-10 items-center text-link underline"
     href={base}>Open full product backlog on the Board →</Link>
 </section>;
}
