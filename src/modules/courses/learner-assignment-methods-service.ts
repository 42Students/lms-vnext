import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseAssignments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireLearningReadAccess} from "./learning-access";
import {loadCourseAssignmentScope} from "./assignment-scope";
import {CoursesServiceError} from "./errors";
import {normalizeAssignmentMethods} from "./assignment-submission-methods";

import { ROLE } from "@/modules/identity/roles";
import { zUuid } from "@/lib/schema-primitives";
/** Read only the current learner's published assignment policy, never another college's. */
export async function getLearnerAssignmentMethods(context:RequestContext,rawId:unknown,rawDeliveryId:unknown){
 const assignmentId=zUuid.parse(rawId);
 const deliveryId=zUuid.parse(rawDeliveryId);
 const assignment=await loadCourseAssignmentScope(assignmentId);
 if(assignment.status!=="PUBLISHED"||!assignment.lessonVisibleToStudents||
  assignment.learningPathStatus!=="PUBLISHED"||assignment.deliveryId&&assignment.deliveryId!==deliveryId)
  throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 const access=await requireLearningReadAccess(context,assignment.offeringId,deliveryId);
 if(access!==ROLE.LEARNER||!context.membership?.roles.includes(ROLE.LEARNER))
  throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 const [row]=await getDb().select({
  methods:courseAssignments.allowedSubmissionMethods,
 }).from(courseAssignments).where(and(eq(courseAssignments.id,assignmentId),
  eq(courseAssignments.status,"PUBLISHED"))).limit(1);
 if(!row)throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 return normalizeAssignmentMethods(row.methods);
}
