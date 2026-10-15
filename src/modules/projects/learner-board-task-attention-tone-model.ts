/** Read-only Project preview tones use only the already-authorized persisted task state. */
export function learnerBoardTaskStatusTone(status:string):"neutral"|"info"|"success"|"warning" {
  if(status==="DONE")return "success";
  if(status==="BLOCKED")return "warning";
  if(status==="IN_PROGRESS"||status==="IN_REVIEW")return "info";
  return "neutral";
}
export function learnerBoardTaskPriorityTone(priority:string):"neutral"|"info"|"warning"|"error" {
  if(priority==="CRITICAL")return "error";
  if(priority==="HIGH")return "warning";
  if(priority==="MEDIUM")return "info";
  return "neutral";
}
