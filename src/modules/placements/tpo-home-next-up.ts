/** Legacy dev-branch homeRows.nextUp, with explicit urgency and action copy. */
export type HomeNeed={
 type:string;priority:number;title:string;count:number;link:string;
};
export type HomeInviteBatch={batchId:string;name:string;eligible:number;registered:number;invitedAt:string|null};
export type HomeStep={label:string;done:boolean;link?:string};
export type HomeNextUp={title:string;text:string;action:string;href:string};
const ACTION:Record<string,string>={
 DRIVE_REQUESTS:"Review requests",RECRUITER_ACCESS:"Review recruiters",
 SHARE_APPLICANTS:"Share applicants",DEADLINE_TODAY:"Remind students",
 SLOTS_TO_CONFIRM:"Confirm slots",RESULTS_READY:"Apply results",
 SELECTIONS_TO_VERIFY:"Verify selections",REQUESTS:"Decide requests",
 RECRUITER_MESSAGES:"Reply",FOLLOW_UPS:"See follow-ups",
 NO_DEADLINE:"Set a deadline",CLOSING_SOON:"Remind students",
 TEAM_ASKS:"See what you were asked",TEAM_MESSAGES:"Read team messages",
 SCREENING_PENDING:"Review applications",
 OFFERS_AWAITING_RESPONSE:"Check offers",
 JOINING_OUTCOME_PENDING:"Record joining",
 DRIVE_NOT_SCHEDULED:"Schedule rounds",
 EVALUATION_PLAN_MISSING:"Set evaluation plan",
};
const count=(n:number,one:string,many=one+"s")=>n+" "+(n===1?one:many);
export function buildTpoLegacyNextUp(input:{
 needsYou:readonly HomeNeed[];batches:readonly HomeInviteBatch[];checklist:readonly HomeStep[];
}):HomeNextUp|null{
 const cards=[...input.needsYou].sort((a,b)=>a.priority-b.priority);
 const top=cards[0];
 if(top?.type==="REGISTRATION_CLOSED"){
  const batch=input.batches.find(b=>!b.invitedAt);
  const eligible=batch?.eligible??top.count;
  const toTell=batch?Math.max(0,eligible-batch.registered):eligible;
  return {title:batch?`Invite the ${batch.name} to register`:top.title,
   text:`${count(toTell,"eligible student hasn't","eligible students haven't")} registered; they can't until you invite the batch.`,
   action:`Invite ${count(toTell,"student")}`,
   href:batch?"/tpo/batches/"+batch.batchId:top.link};
 }
 if(top)return {title:top.title,
  text:cards.length>1?`Then ${count(cards.length-1,"more thing")} after this.`:
   "That is the only thing waiting.",
  action:ACTION[top.type]??"Open",href:top.link};
 const steps=input.checklist.filter(step=>!step.done);
 const firstStep=steps[0];
 if(firstStep)return {title:firstStep.label,
  text:`Setting up placements: ${count(steps.length,"step")} left.`,
  action:"Start",href:firstStep.link??"/tpo/batches"};
 return null;
}
/** Map existing persisted operational queues without inventing a needs-you
 * signal that the query has not yet established. */
export function operationalHomeNeeds(queues:readonly {
 code:string;priority:"HIGH"|"MEDIUM"|"LOW";jobId:string;
 jobTitle:string;companyName:string;count:number;
}[]):HomeNeed[]{
 const kind:Record<string,string>={
  RESULTS_AWAITING_APPLY:"RESULTS_READY",
  SCREENING_PENDING:"SCREENING_PENDING",
  OFFERS_AWAITING_RESPONSE:"OFFERS_AWAITING_RESPONSE",
  JOINING_OUTCOME_PENDING:"JOINING_OUTCOME_PENDING",
  DRIVE_NOT_SCHEDULED:"DRIVE_NOT_SCHEDULED",
  EVALUATION_PLAN_MISSING:"EVALUATION_PLAN_MISSING",

 };
 const titles:Record<string,(q:typeof queues[number])=>string>={
  RESULTS_AWAITING_APPLY:q=>`${q.count} round ${q.count===1?"result is":"results are"} ready to apply for ${q.companyName} · ${q.jobTitle}`,
  SCREENING_PENDING:q=>`Screen ${q.count} ${q.count===1?"application":"applications"} for ${q.companyName} · ${q.jobTitle}`,
  OFFERS_AWAITING_RESPONSE:q=>`Follow up on ${q.count} ${q.count===1?"offer":"offers"} for ${q.companyName} · ${q.jobTitle}`,
  JOINING_OUTCOME_PENDING:q=>`Record joining for ${q.count} ${q.count===1?"student":"students"} at ${q.companyName}`,
  DRIVE_NOT_SCHEDULED:q=>`Schedule ${q.count} ${q.count===1?"round":"rounds"} for ${q.companyName} · ${q.jobTitle}`,
  EVALUATION_PLAN_MISSING:q=>`Add an evaluation plan for ${q.companyName} · ${q.jobTitle}`,
 };
 return queues.flatMap(q=>{
  const type=kind[q.code],titleFor=titles[q.code];
  if(q.count<=0||!type||!titleFor)return [];
  return [{
   type,priority:["RESULTS_READY","SCREENING_PENDING","JOINING_OUTCOME_PENDING","OFFERS_AWAITING_RESPONSE"].includes(type)?1:
     q.priority==="HIGH"?1:q.priority==="MEDIUM"?2:3,
   title:titleFor(q),count:q.count,
   link:"/tpo/placements/jobs/"+encodeURIComponent(q.jobId),
  }];
 });
}
