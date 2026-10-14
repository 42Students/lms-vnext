import "server-only";

import { can } from "@/modules/permissions/policy";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getFacultyCourseWorkspace } from "./faculty-course-service";
import { facultyNoticeParamsSchema, FACULTY_SECTION_NOTICES_BLOCKER } from "./faculty-notices-model";

/** Authoritative Faculty delivery access. No fictional notices are returned. */
export async function getFacultySectionNotices(context:RequestContext, rawParams:unknown) {
  const {deliveryId}=facultyNoticeParamsSchema.parse(rawParams);
  const membership=context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"FACULTY") ||
      !can(context,"courses.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      })) throw new AuthorizationError("courses.read");
  const workspace=await getFacultyCourseWorkspace(context,deliveryId);
  return {
    deliveryId,courseName:workspace.course.courseName,sectionName:workspace.course.sectionName,
    available:false as const,
    blocker:FACULTY_SECTION_NOTICES_BLOCKER,
    items:[] as {id:string;title:string;body:string}[],
  };
}
