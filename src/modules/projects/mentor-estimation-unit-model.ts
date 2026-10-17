export type MentorEstimationUnit="POINTS"|"HOURS"|"TASKS";
export function mentorEstimationUnit(value:string|null|undefined):MentorEstimationUnit{
 return value==="HOURS"||value==="TASKS"?value:"POINTS";
}
export function mentorEstimateOptions(raw:string|null|undefined):readonly number[]{
 const unit=mentorEstimationUnit(raw);
 return unit==="POINTS"?[0,1,2,3,5,8,13,21,34,55,89,144]:
   unit==="HOURS"?[0,1,2,3,4,6,8,12,16,24,32,40,80]:
   [0,1,2,3,5,8,13,21];
}
export function mentorEstimateLabel(value:number|null,raw:string|null|undefined):string{
 if(value===null)return "Not estimated";
 const unit=mentorEstimationUnit(raw);
 return unit==="HOURS"?value+" "+(value===1?"hr":"hrs"):
   unit==="TASKS"?value+" "+(value===1?"task":"tasks"):
   value+" "+(value===1?"pt":"pts");
}
