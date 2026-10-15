export type VerificationQueueItem={learnerMembershipId:string;section:"EDUCATION"|"IDENTITY";submittedAt:Date};
export function orderVerificationQueue<T extends VerificationQueueItem>(rows:readonly T[]):T[]{
 return [...rows].sort((a,b)=>a.submittedAt.getTime()-b.submittedAt.getTime()||
 a.learnerMembershipId.localeCompare(b.learnerMembershipId)||a.section.localeCompare(b.section));
}
