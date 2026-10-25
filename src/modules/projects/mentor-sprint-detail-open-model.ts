import type {MentorSprintSignOffSnapshot} from "./mentor-sprint-signoff-snapshot-model";

/** A completed sprint's live task rows move on after sign-off. Read the
 * immutable snapshot rather than turning its historic open count into zero. */
export function mentorSprintOpenCount(
  status:string,
  currentTaskStatuses:readonly string[],
  saved:MentorSprintSignOffSnapshot|null,
):number|null {
  if(status==="COMPLETED")
    return saved?saved.memberRows.reduce((sum,row)=>sum+row.openCount,0):null;
  return currentTaskStatuses.filter(value=>value!=="DONE"&&value!=="IN_REVIEW").length;
}
