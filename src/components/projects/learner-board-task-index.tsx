import { Badge } from "@/components/ui/badge";
import styles from "./legacy-project-board.module.css";
import { BoardColumn } from "@/components/ui/board-column";
import { EmptyState } from "@/components/ui/empty-state";
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
  <div role="region" aria-label="Project board columns; scroll sideways to see all task lanes" tabIndex={0}
    className={styles.scrollRegion+" min-w-0 overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"}>
   <div className={styles.track}>
    {lanes.map(lane=><BoardColumn key={lane.id} label={lane.label} width="compact" className={styles.lane+(lane.id==="BACKLOG"?" "+styles.backlogLane:"")}>
      <h2 className={styles.header+" flex min-w-0 items-center justify-between font-semibold text-foreground"}>
       <span>{lane.label}</span><Badge tone="neutral" className="tabular-nums">{lane.tasks.length}</Badge>
      </h2>
      <ul className={styles.body+" mt-3 space-y-2"}>
       {lane.tasks.map(task=>{
        const info=learnerBoardCardMetadata(task,sprints);
        return <li key={task.id}>
         <Link href={learnerBoardTaskHref(projectId,filters,task.id)}
          className={styles.card+" block min-h-11 rounded-[var(--lms-radius-card)] border border-border bg-surface p-3 text-sm text-primary-text hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"}>
          <span className="block break-words font-semibold">{task.title}</span>
          <span className="mt-2 block text-xs text-muted-foreground">{info.priority} · {info.sprintTitle}</span>
         </Link>
        </li>;
       })}
       {lane.tasks.length===0?<li><EmptyState title="No tasks" description="No tasks in this lane." /></li>:null}
      </ul>
    </BoardColumn>)}
   </div>
  </div>
 </section>;
}
