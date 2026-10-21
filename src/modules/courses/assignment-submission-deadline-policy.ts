import { CoursesServiceError } from "./errors";

/** Legacy submission errors are distinct even when the vNext endpoint uses
 * one authorization-safe code for a missing, deleted or hidden assignment.
 * The outer request handler must not disclose hidden item existence. */
export const assignmentSubmissionFailureCopy = {
 notAssignment: "Assignment submission requires lesson content type 'assignment' and file_dto or html_content.",
 deleted: "Assignment not found",
 inactive: "Assignment is not available for submission",
 unpublished: "Assignment is not available for submission",
 hidden: "Assignment is not available for submission",
 deadlineUnset: "Assignment deadline is not configured",
 deadlineExpired: "Submission deadline has passed",
} as const;

/** Persisted assignment checks before this function:
 * 1. Non-assignment/missing/deleted -> ASSIGNMENT_NOT_FOUND (never reveal hidden IDs).
 * 2. Inactive/disabled/unpublished/hidden -> ASSIGNMENT_NOT_PUBLISHED.
 * 3. Due date absent/invalid -> ASSIGNMENT_DEADLINE_NOT_CONFIGURED.
 * 4. Due date at/before transaction time -> ASSIGNMENT_DEADLINE_PASSED.
 * The deadline is rechecked against the locked persisted assignment in the
 * submission transaction, not merely the browser's display timestamp. */
export function assertAssignmentSubmissionDeadline(dueAt:Date|null,now:Date):void{
 if(dueAt===null || !Number.isFinite(dueAt.getTime()))
   throw new CoursesServiceError("ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
 if(!Number.isFinite(now.getTime()) || dueAt.getTime()<=now.getTime())
   throw new CoursesServiceError("ASSIGNMENT_DEADLINE_PASSED");
}
