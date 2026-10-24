/**
 * Read-only historical planning and carry guidance for the Mentor overview.
 * All completed-sprint earned points come from immutable sign-off events.
 * Original planned points are only labelled "committed" when a start snapshot exists.
 */
export type MentorPlanSprint={id:string;sequence:number;status:string;
  startDate?:string|null;endDate?:string|null;completedAt?:Date|string|null};
export type MentorPlanSnapshot={sprintId:string;plannedPoints:number;
  donePoints:number;taskCount:number;memberRows:readonly {
    membershipId:string|null;carriedCount:number;taskCount:number;
  }[]};
export type MentorFutureTask={sprintId:string|null;estimatePoints:number|null;
  status:string;deletedAt?:Date|null};
export type MentorPlanFacts={
  signedOff:number;totalSprints:number;
  completedDonePoints:number;plannedToDatePoints:number;
  plannedToDateReliable:boolean;missingSignOffIds:string[];
  missingStartCommitmentIds:string[];
  nextTwo:{sprintId:string;sequence:number;plannedPoints:number;
    taskCount:number;endDate:string|null}[];
  carriedIntoCompleted:number;observedTaskCount:number;
  carryRatioPct:number|null;
  primaryCarrier:{membershipId:string;count:number}|null;
  observedCompletedSprints:number;
  nextTwoEstimatePoints:number;
};

const nonnegative=(value:number|null|undefined)=>
  typeof value==="number"&&Number.isFinite(value)&&value>=0?value:0;

export function deriveMentorPlanFacts(input:{
  sprints:readonly MentorPlanSprint[];
  signOffs:readonly MentorPlanSnapshot[];
  starts:readonly MentorPlanSnapshot[];
  tasks:readonly MentorFutureTask[];
}):MentorPlanFacts {
 const completed=input.sprints.filter(s=>s.status==="COMPLETED");
 const signOff=new Map(input.signOffs.map(s=>[s.sprintId,s] as const));
 const start=new Map(input.starts.map(s=>[s.sprintId,s] as const));
 const observed=completed.flatMap(s=>{
   const snapshot=signOff.get(s.id);
   return snapshot?[snapshot]:[];
 });
 const missingSignOffIds=completed.filter(s=>!signOff.has(s.id)).map(s=>s.id);
 const missingStartCommitmentIds=completed.filter(s=>!start.has(s.id)).map(s=>s.id);
 const completedDonePoints=observed.reduce((n,s)=>n+nonnegative(s.donePoints),0);
 const plannedToDatePoints=completed.reduce((total,s)=>{
   const initial=start.get(s.id),final=signOff.get(s.id);
   return total+nonnegative(initial?.plannedPoints??final?.plannedPoints);
 },0);
 const active=input.sprints.find(s=>s.status==="ACTIVE");
 const activeStart=active?start.get(active.id):null;
 const activeTasks=active?input.tasks.filter(t=>!t.deletedAt&&t.sprintId===active.id):[];
 const activePlan=activeStart?
   nonnegative(activeStart.plannedPoints):
   activeTasks.reduce((n,t)=>n+nonnegative(t.estimatePoints),0);
 const activeDone=activeTasks.filter(t=>t.status==="DONE")
   .reduce((n,t)=>n+nonnegative(t.estimatePoints),0);
 const future=[...input.sprints].filter(s=>s.status==="PLANNED"&&
   (!active||s.sequence>active.sequence))
   .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id)).slice(0,2);
 const nextTwo=future.map(s=>{
  const work=input.tasks.filter(t=>!t.deletedAt&&t.sprintId===s.id);
  return {sprintId:s.id,sequence:s.sequence,
   plannedPoints:work.reduce((n,t)=>n+nonnegative(t.estimatePoints),0),
   taskCount:work.length,endDate:s.endDate??null};
 });
 const byMember=new Map<string,number>();
 let carriedIntoCompleted=0,observedTaskCount=0;
 for(const snapshot of observed){
   observedTaskCount+=snapshot.taskCount;
   for(const member of snapshot.memberRows){
     carriedIntoCompleted+=member.carriedCount;
     if(member.membershipId&&member.carriedCount>0){
       byMember.set(member.membershipId,
        (byMember.get(member.membershipId)??0)+member.carriedCount);
     }
   }
 }
 const primary=[...byMember.entries()]
   .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
 return {
   signedOff:completed.length,totalSprints:input.sprints.length,
   completedDonePoints:completedDonePoints+activeDone,
   plannedToDatePoints:plannedToDatePoints+activePlan,
   plannedToDateReliable:missingSignOffIds.length===0&&
     missingStartCommitmentIds.length===0&&(!active||Boolean(activeStart)),
   missingSignOffIds,missingStartCommitmentIds,
   nextTwo,observedCompletedSprints:observed.length,
   carriedIntoCompleted,observedTaskCount,
   carryRatioPct:observedTaskCount?
     Math.round(carriedIntoCompleted*1000/observedTaskCount)/10:null,
   primaryCarrier:primary?{membershipId:primary[0],count:primary[1]}:null,
   nextTwoEstimatePoints:nextTwo.reduce((n,s)=>n+s.plannedPoints,0),
 };
}
