import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {learnerBoardCardMetadata} from "@/modules/projects/learner-board-card-model";
import { learnerBoardTaskHref, type LearnerTaskBoardUrlFilters } from "@/modules/projects/learner-board-task-detail-model";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";

export function LearnerBoardTaskIndex({projectId,tasks,filters,sprints}:{
 projectId:string;
 tasks:readonly {id:string;title:string;status:string;priority:string;sprintId:string}[];
 sprints:readonly {id:string;title:string;status:string}[];
 filters:LearnerTaskBoardUrlFilters;
}){
 const lanes=groupLearnerBoardLanes(tasks,sprints);
 return <section aria-label="Project Board lanes" className="space-y-3">
  <p className="text-sm text-body">Tasks are grouped by their saved status. Open a task to work on it.</p>
  <div className="overflow-x-auto pb-3">
   <div className="flex min-w-max gap-3">
    {lanes.map(lane=><section key={lane.id} aria-label={lane.label}
      className="w-64 shrink-0 rounded-xl border border-border bg-surface-subtle p-3">
      <h2 className="flex items-center justify-between font-semibold text-foreground">
       <span>{lane.label}</span><Badge  tone="neutral" className="tabular-nums">{lane.tasks.length}</Badge>
      </h2>
      <ul className="mt-3 space-y-2">
       {lane.tasks.map(task=>{
        const info=learnerBoardCardMetadata(task,sprints);
        return <li key={task.id}>
         <Link href={learnerBoardTaskHref(projectId,filters,task.id)}
          className="block min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-primary-text hover:bg-muted">
          <span className="block break-words font-semibold">{task.title}</span>
          <span className="mt-2 block text-xs text-muted-foreground">{info.priority} · {info.sprintTitle}</span>
         </Link>
        </li>;
       })}
       {lane.tasks.length===0?<li className="py-5 text-center text-xs text-muted-foreground">No tasks</li>:null}
      </ul>
    </section>)}
   </div>
  </div>
 </section>;
}
