/**
 * Decide an authorized College Admin attendance correction from the locked
 * current state, not client-provided "previous" values.
 *
 * A missing current row represents implicit PRESENT. A note on an implicit
 * PRESENT mark creates an explicit row so the explanation is not discarded.
 * Clearing an existing note uses the empty submitted string (normalized to
 * null), while an omitted note leaves the existing note unchanged.
 */
export function adminAttendanceCorrectionChange(input: {
  previous: {status: string; note: string | null} | null;
  requestedStatus: string;
  requestedNote: string | undefined;
}) {
  const previousStatus=input.previous?.status??"PRESENT";
  const previousNote=input.previous?.note??null;
  const nextNote=input.requestedNote===undefined
    ?previousNote:(input.requestedNote.trim()||null);
  const statusChanged=previousStatus!==input.requestedStatus;
  const noteChanged=previousNote!==nextNote;
  const changed=statusChanged||noteChanged;
  return {
    previousStatus,previousNote,nextNote,statusChanged,noteChanged,changed,
    mustCreateRecord:input.previous===null&&changed,
    shouldNotifyAbsent:statusChanged&&input.requestedStatus==="ABSENT",
    shouldNotifyCorrected:statusChanged&&previousStatus==="ABSENT"&&input.requestedStatus==="PRESENT",
  };
}
