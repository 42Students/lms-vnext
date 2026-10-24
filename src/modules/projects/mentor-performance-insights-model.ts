import type {MentorSprintSignOffSnapshot} from "./mentor-sprint-signoff-snapshot-model";

export type MentorMemberSprintPoint={
  sprintId:string;sequence:number;donePoints:number;plannedPoints:number;
  carryCount:number;
};
/** A factual summary of recorded sign-off snapshots, not a personal rating. */
export function mentorMemberSprintHistory(
  membershipId:string,
  orderedCompletedSprints:readonly {id:string;sequence:number;status:string}[],
  snapshots:readonly MentorSprintSignOffSnapshot[],
):MentorMemberSprintPoint[]{
  const bySprint=new Map(snapshots.map(row=>[row.sprintId,row] as const));
  return orderedCompletedSprints
    .filter(row=>row.status==="COMPLETED")
    .sort((a,b)=>a.sequence-b.sequence)
    .flatMap(sprint=>{
      const snapshot=bySprint.get(sprint.id);
      if(!snapshot)return [];
      const member=snapshot.memberRows.find(row=>row.membershipId===membershipId);
      return [{sprintId:sprint.id,sequence:sprint.sequence,
        donePoints:member?.donePoints??0,plannedPoints:member?.plannedPoints??0,
        carryCount:member?.carriedCount??0}];
    });
}

export type MentorPerformanceInsight={code:"REPEATED_CARRY"|"CONCENTRATED_ASSIGNMENTS"|
  "LOW_RECORDED_WORK";description:string};

/** All thresholds depend on multiple recorded sprints or task distribution.
 * Missing historical snapshots never count as zero-work observations.
 */
export function deriveMentorPerformanceInsights(input:{
  points:readonly MentorMemberSprintPoint[];
  currentOpenCount:number;
  totalProjectOpen:number;
}):MentorPerformanceInsight[]{
  const result:MentorPerformanceInsight[]=[];
  const recent=input.points.slice(-3);
  const carryPeriods=recent.filter(item=>item.carryCount>0);
  if(recent.length>=3&&carryPeriods.length>=2){
    result.push({code:"REPEATED_CARRY",description:"Tasks carried into "+
      carryPeriods.length+" of the last "+recent.length+" recorded sprints"});
  }
  if(input.currentOpenCount>=4&&input.totalProjectOpen>=6&&
    input.currentOpenCount/input.totalProjectOpen>=0.6){
    result.push({code:"CONCENTRATED_ASSIGNMENTS",
      description:input.currentOpenCount+" of "+input.totalProjectOpen+
        " current open tasks are assigned to this student"});
  }
  if(recent.length===3&&recent.every(item=>item.donePoints===0)&&
    recent.some(item=>item.plannedPoints>0)){
    result.push({code:"LOW_RECORDED_WORK",
      description:"No earned points in the last three recorded sign-offs despite planned work"});
  }
  return result;
}
