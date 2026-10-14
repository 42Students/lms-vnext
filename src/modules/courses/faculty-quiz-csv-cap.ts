/** A bounded export is a subset, not a false claim of a complete gradebook. */
export const FACULTY_QUIZ_CSV_MAX_ROWS=500;
export function capFacultyQuizCsvRows<T,U>(
  attempted:readonly T[],missing:readonly U[],
  maxRows=FACULTY_QUIZ_CSV_MAX_ROWS,
) {
  const safe=Math.max(1,Math.min(FACULTY_QUIZ_CSV_MAX_ROWS,Math.trunc(maxRows)));
  const selectedAttempts=attempted.slice(0,safe);
  const selectedMissing=missing.slice(0,Math.max(0,safe-selectedAttempts.length));
  const omittedRows=attempted.length+missing.length-
    selectedAttempts.length-selectedMissing.length;
  return {selectedAttempts,selectedMissing,omittedRows,
    complete:omittedRows===0};
}
export function facultyQuizCsvNotice(omitted:number) {
  return omitted>0?
    "NOTICE: "+omitted+" additional learner result rows were omitted by the 500-row safety cap. Open the authorized Section report for full details.":
    null;
}

/** Filter authorized latest-attempt and eligible no-attempt lists before
 * applying the same total 500-row export cap. */
export type FacultyQuizCsvFilter="ALL"|"ATTEMPTED"|"NOT_ATTEMPTED";
export function selectFacultyQuizCsvRows<T,U>(
 attempted:readonly T[],notAttempted:readonly U[],filter:FacultyQuizCsvFilter,
){
 return {attempted:filter==="NOT_ATTEMPTED"?[]:attempted,
  missing:filter==="ATTEMPTED"?[]:notAttempted};
}
