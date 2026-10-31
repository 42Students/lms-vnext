/** Attendance corrections operate on the persisted last markedAt,
 * normalized to JavaScript Date's millisecond resolution. */
export function facultyAttendanceCorrectionTokenMatches(
 status:string|null,markedAt:Date|null,expectedIso:string|null|undefined,
):boolean{
 if(status!=="MARKED")return expectedIso===undefined||expectedIso===null;
 if(!markedAt||!expectedIso)return false;
 const token=new Date(expectedIso);
 return Number.isFinite(token.getTime())&&token.getTime()===markedAt.getTime();
}
export function facultyAttendanceNextMarkedAt(now:Date,previous:Date|null){
 return new Date(Math.max(now.getTime(),(previous?.getTime()??0)+1));
}

/**
 * A Faculty bulk correction must advance every changed attendance row's
 * compare-and-set timestamp beyond the latest locked current row. A previous
 * Admin correction can have a later millisecond token than the wall clock.
 * Returning a common timestamp preserves bulk writer behavior and guarantees
 * that an open Admin editor cannot reuse a stale row token.
 */
export function facultyAttendanceNextRosterMarkedAt(
  now: Date,
  currentRows: readonly {markedAt: Date}[],
): Date {
  let latest: Date | null = null;
  for (const row of currentRows) {
    if (!latest || row.markedAt.getTime() > latest.getTime()) latest = row.markedAt;
  }
  return facultyAttendanceNextMarkedAt(now, latest);
}
