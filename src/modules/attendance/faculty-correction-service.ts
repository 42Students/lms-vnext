import "server-only";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {getFacultyAttendanceWorkspace} from "./faculty-service";
import {CoursesServiceError} from "@/modules/courses/errors";
import {facultyCorrectionQuerySchema,facultyCorrectionSessionPage} from "./faculty-correction-model";

/** No registered correction-request table exists. Never report zero requests. */
export async function getFacultyCorrectionAvailability(
  context:RequestContext,raw:unknown,now=new Date(),
){
  const query=facultyCorrectionQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
     !can(context,"courses.read",{
       collegeId:membership.collegeId,organizationId:membership.organizationId,
     }))throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const {course,policy,sessions}=await getFacultyAttendanceWorkspace(context,query.deliveryId);
  const page=facultyCorrectionSessionPage(sessions,query,policy.correctionWindowHours,now);
  return {
    query,course,correctionWindowHours:policy.correctionWindowHours,
    requestsAvailable:false as const,requestHistory:null,
    ...page,
  };
}
