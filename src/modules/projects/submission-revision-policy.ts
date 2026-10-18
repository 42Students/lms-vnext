/** Optimistic edit tokens for final-delivery drafts.
 * Database writes hold a row lock. Every successful edit must advance the
 * timestamp by at least 1 ms to distinguish even same-millisecond writers.
 */
export function projectDraftRevisionMatches(current:Date,expected:string):boolean {
  const expectedMillis=Date.parse(expected);
  return Number.isFinite(expectedMillis)&&
    Number.isFinite(current.getTime())&&
    current.getTime()===expectedMillis;
}

export function nextProjectDraftUpdatedAt(previous:Date,now:Date=new Date()):Date {
  const previousMillis=previous.getTime();
  const nowMillis=now.getTime();
  if(!Number.isFinite(previousMillis)||!Number.isFinite(nowMillis)){
    throw new Error("Invalid project draft revision clock");
  }
  return new Date(Math.max(nowMillis,previousMillis+1));
}
