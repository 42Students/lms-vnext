/** Only outstanding quizzes are actionable; MISSED/CLOSED or completed quizzes
 * must not appear as future due work even if their authored deadline is future. */
export function learnerUpcomingQuizEligible(input:{
 status:string;dueAt:Date|null;
},nowMs:number,windowEndMs:number):boolean{
 const due=input.dueAt?.getTime();
 return (input.status==="NOT_STARTED" || input.status==="IN_PROGRESS")&&due!==undefined&&
  Number.isFinite(due)&&Number.isFinite(nowMs)&&
  due>=nowMs&&due<=windowEndMs;
}
