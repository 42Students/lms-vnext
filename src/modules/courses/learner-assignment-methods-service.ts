import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseAssignments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireLearningReadAccess} from "./learning-access";
import {loadCourseAssignmentScope} from "./assignment-scope";
import {CoursesServiceError} from "./errors";
import {normalizeAssignmentMethods} from "./assignment-submission-methods";

/** Read only the current learner's published assignment policy, never another college's. */
export async function getLearnerAssignmentMethods(context:RequestContext,rawId:unknown,rawDeliveryId:unknown){
 const assignmentId=z.string().uuid().parse(rawId);
 const deliveryId=z.string().uuid().parse(rawDeliveryId);
 const assignment=await loadCourseAssignmentScope(assignmentId);
 if(assignment.status!=="PUBLISHED"||assignment.deliveryId&&assignment.deliveryId!==deliveryId)
  throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 const access=await requireLearningReadAccess(context,assignment.offeringId,deliveryId);
 if(access!=="LEARNER"||!context.membership?.roles.includes("LEARNER"))
  throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 if(process.env.DB06_MULTIPART_SUBMISSIONS_READY!=="DB06_VERIFIED")
  return normalizeAssignmentMethods(null);
 const [row]=await getDb().select({
  methods:sql<unknown>`allowed_submission_methods`,
 }).from(courseAssignments).where(and(eq(courseAssignments.id,assignmentId),
  eq(courseAssignments.status,"PUBLISHED"))).limit(1);
 if(!row)throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 return normalizeAssignmentMethods(row.methods);
}
