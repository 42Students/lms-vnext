export const LEARNER_BOARD_LANES=[
 {id:"BACKLOG",label:"Backlog"},
 {id:"TODO",label:"To Do"},
 {id:"IN_PROGRESS",label:"In Progress"},
 {id:"IN_REVIEW",label:"In Review"},
 {id:"BLOCKED",label:"Blocked"},
 {id:"DONE",label:"Completed"},
] as const;
export type LearnerBoardLane=(typeof LEARNER_BOARD_LANES)[number]["id"];
/** Legacy board backlog is tasks in a not-yet-active sprint, not arbitrary TODO. */
export function learnerTaskLane(task:{status:string;sprintId:string},sprints:ReadonlyMap<string,string>):LearnerBoardLane{
 if(task.status==="TODO" && sprints.get(task.sprintId)!=="ACTIVE")return "BACKLOG";
 if(task.status==="TODO"||task.status==="IN_PROGRESS"||task.status==="IN_REVIEW"||
    task.status==="BLOCKED"||task.status==="DONE")return task.status;
 return "BACKLOG";
}
export function groupLearnerBoardLanes<T extends {status:string;sprintId:string}>(
 tasks:readonly T[],sprints:readonly {id:string;status:string}[]){
 const bySprint=new Map(sprints.map(item=>[item.id,item.status]));
 return LEARNER_BOARD_LANES.map(lane=>({...lane,tasks:tasks.filter(task=>
   learnerTaskLane(task,bySprint)===lane.id)}));
}
