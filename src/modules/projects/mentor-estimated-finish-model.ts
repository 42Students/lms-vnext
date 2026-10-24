import type {MentorVelocityProjection} from "./mentor-sprint-velocity-model";

export type MentorFinishForecast=
 |{kind:"UNAVAILABLE";reason:string}
 |{kind:"PROJECTED";sprintDays:number;projectedFinishDate:string;
   dueDate:string|null;dueComparison:"BEFORE_OR_ON"|"AFTER"|"NO_DUE_DATE";
   approximateSprints:number};

/** A conditional, descriptive forecast—not a calendar promise. Never infer
 * duration from imported labels or future sprints without valid date ranges.
 * Uses the median positive completed sprint window, clamped to 1–42 days.
 */
export function estimateMentorFinishWindow(input:{
 velocity:MentorVelocityProjection;
 sprints:readonly {status:string;startDate:string|null;endDate:string|null}[];
 asOf:Date;dueDate:string|null;
}):MentorFinishForecast {
 if(input.velocity.kind!=="ESTIMATE")return {
   kind:"UNAVAILABLE",reason:"Historical earned-point samples are insufficient."};
 const samples=input.sprints.filter(s=>s.status==="COMPLETED")
  .flatMap(s=>{
    if(!s.startDate||!s.endDate||
      !/^\d{4}-\d{2}-\d{2}$/.test(s.startDate)||
      !/^\d{4}-\d{2}-\d{2}$/.test(s.endDate))return [];
    const start=Date.parse(s.startDate+"T00:00:00Z");
    const end=Date.parse(s.endDate+"T00:00:00Z");
    const days=Math.round((end-start)/86400000)+1;
    return days>=1&&days<=42?[days]:[];
  }).sort((a,b)=>a-b);
 if(samples.length<3)return {kind:"UNAVAILABLE",
   reason:"At least three completed sprints need valid dated windows to estimate a finish date."};
 if(!Number.isFinite(input.asOf.getTime()))return {
  kind:"UNAVAILABLE",reason:"Current date is unavailable."};
 const middle=Math.floor(samples.length/2);
 const median=samples.length%2===1?samples[middle]!:
  (samples[middle-1]!+samples[middle]!)/2;
 const sprintDays=Math.round(median*10)/10;
 const days=Math.ceil(input.velocity.approximateSprints*sprintDays);
 const today=new Date(Date.UTC(input.asOf.getUTCFullYear(),
   input.asOf.getUTCMonth(),input.asOf.getUTCDate()));
 today.setUTCDate(today.getUTCDate()+days);
 const projectedFinishDate=today.toISOString().slice(0,10);
 const dueDate=input.dueDate&&/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)&&
   Number.isFinite(Date.parse(input.dueDate+"T00:00:00Z"))?input.dueDate:null;
 return {
   kind:"PROJECTED",sprintDays,projectedFinishDate,dueDate,
   dueComparison:dueDate===null?"NO_DUE_DATE":
     projectedFinishDate<=dueDate?"BEFORE_OR_ON":"AFTER",
   approximateSprints:input.velocity.approximateSprints,
 };
}
