export type VerificationQueueItem={learnerMembershipId:string;section:"EDUCATION"|"IDENTITY";submittedAt:Date};
export function orderVerificationQueue<T extends VerificationQueueItem>(rows:readonly T[],sort:"OLDEST"|"NEWEST"="OLDEST"):T[]{
 const direction=sort==="NEWEST"?-1:1;
 return [...rows].sort((a,b)=>direction*(a.submittedAt.getTime()-b.submittedAt.getTime())||
 a.learnerMembershipId.localeCompare(b.learnerMembershipId)||a.section.localeCompare(b.section));
}
