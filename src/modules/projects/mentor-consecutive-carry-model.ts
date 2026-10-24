import type {MentorSprintSignOffSnapshot} from "./mentor-sprint-signoff-snapshot-model";
export type MentorRecentCompletedSprint={id:string;sequence:number;projectId:string;historyOrdinal:number};

/** A positive signal requires at least two consecutive recorded completed
 * sprints. Missing snapshots or skipped sprint slots break the chain.
 * Sprint sequence numbers are only unique within a release, so the caller
 * supplies a project-wide history ordinal that includes unfinished sprints.
 * This tracks work carried INTO a sprint by recorded assignee, not a student's
 * personal engagement or a guaranteed blame assignment.
 */
export function mentorConsecutiveCarryInSignal(
 memberId:string,projectId:string,
 newestSprints:readonly MentorRecentCompletedSprint[],
 snapshots:readonly MentorSprintSignOffSnapshot[],
):{consecutive:number;carriedTasks:number}|null{
 const history=new Map(snapshots.map(row=>[row.sprintId,row] as const));
 const sorted=newestSprints.filter(row=>row.projectId===projectId)
   .sort((a,b)=>a.historyOrdinal-b.historyOrdinal).slice(0,3);
 let consecutive=0,carriedTasks=0;
 let lastOrdinal:number|null=null;
 for(const sprint of sorted){
  // Nonadjacent project sprint slots cannot establish a consecutive streak.
  if(lastOrdinal!==null&&sprint.historyOrdinal!==lastOrdinal+1)break;
  lastOrdinal=sprint.historyOrdinal;
  const snapshot=history.get(sprint.id);
  if(!snapshot)break;
  const member=snapshot.memberRows.find(row=>row.membershipId===memberId);
  const count=member?.carriedCount??0;
  if(count===0)break;
  consecutive++;carriedTasks+=count;
 }
 return consecutive>=2?{consecutive,carriedTasks}:null;
}
