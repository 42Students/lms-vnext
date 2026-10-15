/** Persisted attempt number is authoritative; response order need not be
 * stable across refreshes, pagination or equal-time submissions. */
export function selectLearnerLatestQuizAttempt<T extends {
 id:string;attemptNumber:number;submittedAt:string;
}>(rows:readonly T[]):T|null{
 let latest:T|null=null;
 for(const row of rows){
  if(!Number.isSafeInteger(row.attemptNumber)||row.attemptNumber<=0)continue;
  if(!latest||row.attemptNumber>latest.attemptNumber ||
    (row.attemptNumber===latest.attemptNumber &&
      (row.submittedAt>latest.submittedAt ||
        (row.submittedAt===latest.submittedAt&&row.id>latest.id))))latest=row;
 }
 return latest;
}
