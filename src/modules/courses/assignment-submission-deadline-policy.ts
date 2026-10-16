import { CoursesServiceError } from "./errors";
/** LEARNER-learning-misc-05: legacy dev rejects missing/expired due dates.
 * Apply to the locked persisted assignment inside the submission transaction. */
export function assertAssignmentSubmissionDeadline(dueAt:Date|null,now:Date):void{
 if(dueAt===null || !Number.isFinite(dueAt.getTime()))
   throw new CoursesServiceError("ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
 if(!Number.isFinite(now.getTime()) || dueAt.getTime()<=now.getTime())
   throw new CoursesServiceError("ASSIGNMENT_DEADLINE_PASSED");
}
