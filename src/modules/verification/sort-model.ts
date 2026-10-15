export type VerificationQueueSort="OLDEST"|"NEWEST";
export function verificationSortDirection(value:VerificationQueueSort){
 return value==="NEWEST"?"descending":"ascending";
}
