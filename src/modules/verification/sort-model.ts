export type VerificationQueueSort="OLDEST"|"NEWEST"|"NAME";
export function verificationSortDirection(value:VerificationQueueSort){
 return value==="NEWEST"?"descending":"ascending";
}
