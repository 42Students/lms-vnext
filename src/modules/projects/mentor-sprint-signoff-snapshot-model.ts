/** Immutable, privacy-minimal workload facts recorded when a sprint is signed off.
 * This is a point-in-time snapshot at sign-off, NOT the original sprint plan.
 * Task/member membership changes after this point must not rewrite history.
 */
export type MentorSprintTaskAtSignOff = {
  status:string;
  estimatePoints:number|null;
  assigneeMembershipId:string|null;
  carriedFromSprintId:string|null;
};
export type MentorSprintMemberSnapshot = {
  membershipId:string|null;
  taskCount:number;
  doneCount:number;
  waitingCount:number;
  openCount:number;
  carriedCount:number;
  donePoints:number;
  plannedPoints:number;
};
export type MentorSprintSignOffSnapshot = {
  version:1;
  sprintId:string;
  plannedPoints:number;
  donePoints:number;
  taskCount:number;
  memberRows:MentorSprintMemberSnapshot[];
};

export function buildMentorSprintSignOffSnapshot(
  sprintId:string,tasks:readonly MentorSprintTaskAtSignOff[],
):MentorSprintSignOffSnapshot {
  const byMember=new Map<string|null,MentorSprintMemberSnapshot>();
  let plannedPoints=0;
  let donePoints=0;
  for(const task of tasks){
    const amount=task.estimatePoints??0;
    plannedPoints+=amount;
    if(task.status==="DONE")donePoints+=amount;
    const key=task.assigneeMembershipId;
    let member=byMember.get(key);
    if(!member){
      member={membershipId:key,taskCount:0,doneCount:0,waitingCount:0,
        openCount:0,carriedCount:0,donePoints:0,plannedPoints:0,plannedPoints:0};
      byMember.set(key,member);
    }
    member.taskCount++;
    member.plannedPoints+=amount;
    if(task.status==="DONE"){
      member.doneCount++;
      member.donePoints+=amount;
    }else if(task.status==="IN_REVIEW"){
      member.waitingCount++;
    }else{
      member.openCount++;
    }
    if(task.carriedFromSprintId)member.carriedCount++;
  }
  return {version:1,sprintId,plannedPoints,donePoints,taskCount:tasks.length,
    memberRows:[...byMember.values()].sort((a,b)=>
      (a.membershipId??"").localeCompare(b.membershipId??""))};
}

const isRecord=(value:unknown):value is Record<string,unknown>=>
  value!==null&&typeof value==="object"&&!Array.isArray(value);
const isCount=(value:unknown):value is number=>
  typeof value==="number"&&Number.isSafeInteger(value)&&value>=0;
const validMember=(value:unknown):value is MentorSprintMemberSnapshot=>
  isRecord(value)&&(value["membershipId"]===null||
      typeof value["membershipId"]==="string")&&
  isCount(value["taskCount"])&&isCount(value["doneCount"])&&
  isCount(value["waitingCount"])&&isCount(value["openCount"])&&
  isCount(value["carriedCount"])&&isCount(value["donePoints"])&&
  isCount(value["plannedPoints"])&&value["donePoints"]<=value["plannedPoints"]&&
  value["doneCount"]+value["waitingCount"]+value["openCount"]===value["taskCount"]&&
  value["carriedCount"]<=value["taskCount"];

/** Read historical JSON with fail-closed validation; old events are not snapshots. */
export function parseMentorSprintSignOffSnapshot(
  value:unknown,expectedSprintId:string,
):MentorSprintSignOffSnapshot|null {
  if(!isRecord(value)||value["version"]!==1||
    value["sprintId"]!==expectedSprintId||!isCount(value["taskCount"])||
    !isCount(value["plannedPoints"])||!isCount(value["donePoints"])||
    value["donePoints"]>value["plannedPoints"]||
    !Array.isArray(value["memberRows"])||value["memberRows"].length>2000||
    !value["memberRows"].every(validMember))return null;
  const rows:MentorSprintMemberSnapshot[]=value["memberRows"];
  if(rows.reduce((sum,row)=>sum+row.taskCount,0)!==value["taskCount"]||
    rows.reduce((sum,row)=>sum+row.donePoints,0)!==value["donePoints"]||
    rows.reduce((sum,row)=>sum+row.plannedPoints,0)!==value["plannedPoints"]||
    new Set(rows.map(row=>row.membershipId)).size!==rows.length)return null;
  return {version:1,sprintId:expectedSprintId,
    taskCount:value["taskCount"],plannedPoints:value["plannedPoints"],
    donePoints:value["donePoints"],memberRows:rows};
}

export const emptyMentorMemberWork=():MentorSprintMemberSnapshot=>({
  membershipId:null,taskCount:0,doneCount:0,waitingCount:0,
  openCount:0,carriedCount:0,donePoints:0,
});
