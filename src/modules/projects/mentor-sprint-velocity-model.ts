import {orderMentorSprints,type MentorOrderedRelease} from "./mentor-sprint-order-model";

/** Read-only, defensible sprint velocity derived only from persisted
 * sign-off facts. An estimate is NOT a delivery commitment or due-date check.
 */
export type MentorVelocitySprint={id:string;sequence:number;status:string;releaseId?:string};
export type MentorVelocitySnapshot={sprintId:string;donePoints:number;plannedPoints:number};
export type MentorVelocityProjection=
  |{kind:"INSUFFICIENT";sampleCount:number;reason:string}
  |{kind:"ESTIMATE";sampleCount:number;averageDonePoints:number;
    remainingPoints:number;approximateSprints:number;trend:"RISING"|"FALLING"|"STEADY"|"UNKNOWN"};

export function projectMentorVelocity(
  sprints:readonly MentorVelocitySprint[],
  snapshots:readonly MentorVelocitySnapshot[],
  remainingPoints:number,
  releases?:readonly MentorOrderedRelease[],
):MentorVelocityProjection {
  const byId=new Map(snapshots.map(row=>[row.sprintId,row] as const));
  // Release-local sequence may restart at zero; the latest four signed-off
  // sprints must follow project-wide release order, not numeric sprint IDs.
  const releaseScoped=sprints.filter(
    (row):row is MentorVelocitySprint&{releaseId:string}=>typeof row.releaseId==="string");
  const chronological=releases&&releaseScoped.length===sprints.length
    ?orderMentorSprints(releaseScoped,releases)
    :[...sprints].sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));
  const samples=chronological.filter(row=>row.status==="COMPLETED")
    .reverse()
    .flatMap(row=>{
      const item=byId.get(row.id);
      return item&&Number.isFinite(item.donePoints)&&item.donePoints>=0&&
        Number.isFinite(item.plannedPoints)&&item.plannedPoints>=item.donePoints
        ?[item.donePoints]:[];
    }).slice(0,4);
  if(samples.length<3)return {kind:"INSUFFICIENT",sampleCount:samples.length,
    reason:"At least three signed-off sprints with recorded workload are needed."};
  const average=samples.reduce((sum,amount)=>sum+amount,0)/samples.length;
  if(average<=0||!Number.isFinite(remainingPoints)||remainingPoints<0)
    return {kind:"INSUFFICIENT",sampleCount:samples.length,
      reason:"Recorded earned points or remaining estimates are insufficient for a forecast."};
  const earlier=samples.length===4?(samples[2]!+samples[3]!)/2:null;
  const latest=samples.length===4?(samples[0]!+samples[1]!)/2:null;
  const trend=earlier===null||latest===null||earlier===0?"UNKNOWN":
    latest>earlier*1.1?"RISING":latest<earlier*0.9?"FALLING":"STEADY";
  return {kind:"ESTIMATE",sampleCount:samples.length,
    averageDonePoints:Math.round(average*10)/10,
    remainingPoints,approximateSprints:Math.ceil(remainingPoints/average),trend};
}
