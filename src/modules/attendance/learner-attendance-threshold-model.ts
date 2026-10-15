/** Compare exact persisted counts; a rounded 74.6% must not pass a 75% policy. */
export function learnerAttendanceThresholdReached(present:number,marked:number,threshold:number):boolean {
  if(!Number.isSafeInteger(present)||!Number.isSafeInteger(marked)||marked<=0||present<0||present>marked||!Number.isFinite(threshold)||threshold<0||threshold>100)return false;
  return present*100>=threshold*marked;
}
