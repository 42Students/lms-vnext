export type HrProposalAttempt={signature:string;submissionId:string};
export function nextHrProposalAttempt(
 previous:HrProposalAttempt|null,signature:string,generateId:()=>string,
):HrProposalAttempt{
 if(previous?.signature===signature)return previous;
 return {signature,submissionId:generateId()};
}
