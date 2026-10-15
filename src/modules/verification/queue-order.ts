export type VerificationQueueItem={learnerMembershipId:string;section:"EDUCATION"|"IDENTITY";submittedAt:Date;learnerName?:string};
export function orderVerificationQueue<T extends VerificationQueueItem>(rows:readonly T[],sort:"OLDEST"|"NEWEST"|"NAME"="OLDEST"):T[]{
 const direction=sort==="NEWEST"?-1:1;
 return [...rows].sort((a,b)=>(sort==="NAME"?(a.learnerName??"").toLowerCase().localeCompare((b.learnerName??"").toLowerCase()):direction*(a.submittedAt.getTime()-b.submittedAt.getTime()))||
 a.learnerMembershipId.localeCompare(b.learnerMembershipId)||a.section.localeCompare(b.section));
}

/** SQL-limited pages must keep their database ORDER BY; client collations are not equivalent. */
export function displayVerificationQueueOrder<T extends VerificationQueueItem>(
 rows:readonly T[],sort:"OLDEST"|"NEWEST"|"NAME",serverOrdered:boolean
):T[]{
 return serverOrdered?[...rows]:orderVerificationQueue(rows,sort);
}
