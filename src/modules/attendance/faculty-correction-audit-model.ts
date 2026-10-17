export function facultyCorrectionDelta(oldAbsent:readonly string[],nextAbsent:readonly string[]){
 const prior=new Set(oldAbsent),next=new Set(nextAbsent);
 const movedToAbsent=[...next].filter(id=>!prior.has(id)).length;
 const movedToPresent=[...prior].filter(id=>!next.has(id)).length;
 return {movedToAbsent,movedToPresent,changed:movedToAbsent+movedToPresent>0};
}
export function facultyCorrectionReasonValid(input:string|null|undefined){
 const normalized=input?.trim()??"";
 return normalized.length>=8&&normalized.length<=500;
}

/** Confirmation text contains counts only, never learner identifiers. */
export function facultyAttendanceConfirmation(
  marked: boolean, previousAbsent: readonly string[], nextAbsent: readonly string[], rosterCount: number,
): string | null {
  const absentCount = new Set(nextAbsent).size;
  if (!Number.isInteger(rosterCount) || rosterCount < 1 || absentCount > rosterCount) return null;
  if (!marked) return `Submit Attendance — Mark ${absentCount} student(s) absent and ${rosterCount - absentCount} student(s) present?`;
  const delta = facultyCorrectionDelta(previousAbsent, nextAbsent);
  if (!delta.changed) return null;
  return `Confirm correction: ${delta.movedToAbsent} changed to absent, ${delta.movedToPresent} changed to present. Your explanation will be retained in the activity audit.`;
}

/** Learner notification recipients are status transitions, never a whole roster.
 * Initial marking sends only newly absent; a correction notifies only changed rows.
 */
export function facultyAttendanceChangedMemberships(
 previousAbsent:readonly string[],nextAbsent:readonly string[],
):{newlyAbsent:string[];correctedPresent:string[]}{
 const previous=new Set(previousAbsent),next=new Set(nextAbsent);
 return {
  newlyAbsent:[...next].filter(id=>!previous.has(id)),
  correctedPresent:[...previous].filter(id=>!next.has(id)),
 };
}
