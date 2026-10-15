import {z} from "zod";
export const LEARNER_BOARD_PRIORITY_LABELS=[
 {value:"LOW",label:"Low"},
 {value:"MEDIUM",label:"Medium"},
 {value:"HIGH",label:"High"},
 {value:"CRITICAL",label:"Critical"},
] as const;
type Priority=(typeof LEARNER_BOARD_PRIORITY_LABELS)[number]["value"];
export type LearnerBoardPriorityCounts=Record<Priority,number>;
const prioritySchema=z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]);
export function learnerBoardPriorityCounts(tasks:readonly {priority:string}[]):LearnerBoardPriorityCounts{
 const counts:LearnerBoardPriorityCounts={LOW:0,MEDIUM:0,HIGH:0,CRITICAL:0};
 for(const task of tasks){
  const parsed=prioritySchema.safeParse(task.priority);
  if(parsed.success)counts[parsed.data]++;
 }
 return counts;
}
export function learnerBoardPriorityFilterHref(
 projectId:string,filters:{taskSearch:string;priority:string;status:string;sprintId:string;releaseId:string;taskSort?:string},
 priority:Priority,
):string {
 const query=new URLSearchParams({tab:"board",priority});
 if(filters.taskSearch)query.set("taskSearch",filters.taskSearch.slice(0,100));
 if(filters.status)query.set("taskStatus",filters.status);
 if(filters.sprintId)query.set("sprintId",filters.sprintId);
 if(filters.releaseId)query.set("releaseId",filters.releaseId);
 if(filters.taskSort&&filters.taskSort!=="DEFAULT")query.set("taskSort",filters.taskSort);
 return "/learn/projects/"+encodeURIComponent(projectId)+"?"+query.toString();
}
