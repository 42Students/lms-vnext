/** Factual project delivery prechecks backed by persisted execution readiness.
 * Normal submission requires shipped releases, completed Sprints and all tasks
 * done. A saved administrator FORCE_UNLOCK can bypass normal execution rules;
 * proof links and the target date remain advisory under current LMS policy.
 */
export type MentorDeliveryPrecheck={
 key:"SPRINTS"|"TASKS"|"RELEASES"|"EVIDENCE"|"TARGET";
 label:string;state:"MET"|"OPEN"|"UNKNOWN"|"PAST_TARGET";
 requiredByServer:boolean;
};
export function mentorDeliveryPrechecks(input:{
 sprints:{total:number;completed:number};
 tasks:{total:number;done:number;proofCovered:number};
 releases:{total:number;shipped:number};
 targetEndDate:string|null;asOfIstDate:string;
}):MentorDeliveryPrecheck[]{
 const nonnegative=(n:number)=>Number.isSafeInteger(n)&&n>=0?n:0;
 const sprints=nonnegative(input.sprints.total),
  signed=nonnegative(input.sprints.completed);
 const tasks=nonnegative(input.tasks.total),done=nonnegative(input.tasks.done);
 const releases=nonnegative(input.releases.total),shipped=nonnegative(input.releases.shipped);
 const proof=nonnegative(input.tasks.proofCovered);
 const due=input.targetEndDate&&/^\d{4}-\d{2}-\d{2}$/.test(input.targetEndDate)
  ?input.targetEndDate:null;
 const current=/^\d{4}-\d{2}-\d{2}$/.test(input.asOfIstDate)
  ?input.asOfIstDate:null;
 return [
  {key:"SPRINTS",label:signed+" of "+sprints+" sprints signed off",
    state:sprints>0&&sprints===signed?"MET":"OPEN",requiredByServer:true},
  {key:"TASKS",label:done+" of "+tasks+" current tasks completed",
    state:tasks>0&&tasks===done?"MET":"OPEN",requiredByServer:true},
  {key:"RELEASES",label:shipped+" of "+releases+" releases shipped",
    state:releases>0&&releases===shipped?"MET":"OPEN",requiredByServer:true},
  {key:"EVIDENCE",label:proof+" of "+done+" completed tasks have proof links",
    state:done>0&&proof>=done?"MET":"OPEN",requiredByServer:false},
  {key:"TARGET",label:due?"Project target: "+due:"Project target date not recorded",
    state:!due||!current?"UNKNOWN":due<current?"PAST_TARGET":"MET",
    requiredByServer:false},
 ];
}
