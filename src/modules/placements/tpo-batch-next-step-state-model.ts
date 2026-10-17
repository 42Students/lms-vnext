export type TpoBatchNextStepFacts={
 finished:boolean;activeLearners:number;eligible:number|null;undecided:number|null;
 invited:boolean;deadline:Date|null;invitable:number;registered:number|null;
};
export function projectTpoBatchNextStep(f:TpoBatchNextStepFacts,now:Date){
 if(f.finished)return {title:"This batch is finished",detail:"It is left out of counts and its students can't apply on their own. You can still add them to a drive.",href:"/history",button:"Review history"};
 if(f.activeLearners===0)return {title:"No students yet",detail:"Add them to the batch's classes in Academic Setup.",href:"/students",button:"Review students"};
 if(f.eligible===null||f.undecided===null)return {title:"Review incomplete eligibility",detail:"Learner eligibility totals could not be verified. Review the Students tab before inviting.",href:"/students",button:"Review decisions"};
 if(f.eligible===0||f.undecided>0)return {title:"Decide who is in placements",detail:"Below: the whole batch at once, class by class, or student by student in the sheet.",href:"/students?decision=NOT_DECIDED",button:"Decide learners"};
 if(!f.invited)return {title:"Invite "+f.invitable+" eligible "+(f.invitable===1?"student":"students")+" to register",detail:"Pick the registration deadline first, then invite eligible learners who have not chosen already.",href:"#batch-invite",button:"Set deadline and invite"};
 if(f.invitable>0&&(!f.deadline||f.deadline.getTime()<=now.getTime())){
  const date=f.deadline?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(f.deadline):"the recorded deadline";
  return {title:"Registration closed on "+date,detail:"Move the deadline to reopen it and tell eligible learners in the app.",href:"#batch-invite",button:"Reopen and tell them"};
 }
 if(f.invitable>0)return {title:"Registration is open · "+f.invitable+" "+(f.invitable===1?"student hasn't":"students haven't")+" registered",
   detail:"Remind eligible learners in the app or move the deadline. Their choices remain private until recorded.",href:"#batch-invite",button:"Remind or move deadline"};
 return {title:"Everyone has chosen already",detail:"All eligible learners have recorded a choice or are already in placement activity. Continue with Student profiles and placement drives.",href:"/students",button:"Continue on Students"};
}
