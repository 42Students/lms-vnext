export type MentorAutoAssignTask={
 id:string;sequence:number;sprintId:string|null;status:string;
 assigneeMembershipId:string|null;estimatePoints:number|null;
 deletedAt?:Date|null;
};
export type MentorNextAssignment={
 taskId:string;membershipId:string;estimatedPoints:number;
 reason:string;
};
export type MentorNextSprintAssignmentPlan={
 assignments:MentorNextAssignment[];
 loads:Array<{membershipId:string;beforePoints:number;afterPoints:number;
 beforeTasks:number;afterTasks:number}>;
};
/** This plan is a transparent deterministic preview; the DB service
 * recalculates it UNDER ROW LOCKS immediately before the real transaction.
 * Points, not just task counts, are balanced. Missing estimates are zero,
 * and unknown/removed learners never become assignment targets.
 */
export function planMentorNextSprintAssignments(
 tasks:readonly MentorAutoAssignTask[],
 activeMemberIds:readonly string[],
 targetSprintId:string,
 eligibleOpenSprintIds?:ReadonlySet<string>,
):MentorNextSprintAssignmentPlan{
 const ids=[...new Set(activeMemberIds)].sort();
 const loads=new Map(ids.map(id=>[id,{
  membershipId:id,beforePoints:0,afterPoints:0,beforeTasks:0,afterTasks:0,
 }]));
 const open=tasks.filter(task=>!task.deletedAt&&
   task.status!=="DONE"&&
   (task.sprintId===null||!eligibleOpenSprintIds||
     eligibleOpenSprintIds.has(task.sprintId)));
 for(const task of open){
  const load=task.assigneeMembershipId?loads.get(task.assigneeMembershipId):null;
  if(load){
   load.beforePoints+=task.estimatePoints??0;
   load.afterPoints+=task.estimatePoints??0;
   load.beforeTasks++;load.afterTasks++;
  }
 }
 const candidates=open.filter(task=>
   task.sprintId===targetSprintId&&task.assigneeMembershipId===null&&
   ["TODO","IN_PROGRESS","BLOCKED"].includes(task.status))
   .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));
 const assignments:MentorNextAssignment[]=[];
 for(const task of candidates){
  const next=[...loads.values()].sort((a,b)=>
   a.afterPoints-b.afterPoints||
   a.afterTasks-b.afterTasks||
   a.membershipId.localeCompare(b.membershipId))[0];
  if(!next)break;
  const estimatedPoints=task.estimatePoints??0;
  assignments.push({
   taskId:task.id,membershipId:next.membershipId,estimatedPoints,
   reason:"Fewest estimated open project points; ties use task count and learner ID.",
  });
  next.afterPoints+=estimatedPoints;next.afterTasks++;
 }
 return {assignments,loads:[...loads.values()].sort((a,b)=>
   a.membershipId.localeCompare(b.membershipId))};
}
