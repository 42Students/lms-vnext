import { z } from "zod";
export const LEARNER_BOARD_STATUS_LABELS=[
 {value:"TODO",label:"To do"},
 {value:"IN_PROGRESS",label:"In progress"},
 {value:"BLOCKED",label:"Blocked"},
 {value:"IN_REVIEW",label:"In review"},
 {value:"DONE",label:"Done"},
] as const;
type Status=(typeof LEARNER_BOARD_STATUS_LABELS)[number]["value"];
export type LearnerBoardStatusCounts=Record<Status,number>;
const statuses=z.enum(["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]);
export function learnerBoardStatusCounts(tasks:readonly {status:string}[]):LearnerBoardStatusCounts {
 const counts:LearnerBoardStatusCounts={TODO:0,IN_PROGRESS:0,BLOCKED:0,IN_REVIEW:0,DONE:0};
 for(const task of tasks){const state=statuses.safeParse(task.status);if(state.success)counts[state.data]++;}
 return counts;
}
export function learnerBoardStatusFilterHref(projectId:string, filters:{
 taskSearch:string;priority:string;status:string;sprintId:string;releaseId:string;taskSort?:string;
},next:Status):string {
 const q=new URLSearchParams({tab:"board",taskStatus:next});
 if(filters.taskSearch)q.set("taskSearch",filters.taskSearch.slice(0,100));
 if(filters.priority)q.set("priority",filters.priority);
 if(filters.sprintId)q.set("sprintId",filters.sprintId);
 if(filters.releaseId)q.set("releaseId",filters.releaseId);
 if(filters.taskSort&&filters.taskSort!=="DEFAULT")q.set("taskSort",filters.taskSort);
 return "/learn/projects/"+encodeURIComponent(projectId)+"?"+q.toString();
}
