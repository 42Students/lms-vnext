import "server-only";

import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can, AuthorizationError } from "@/modules/permissions/policy";
import { getOwnFacultyProfileWithRuntime } from "@/modules/people/runtime";
import { listFacultyCourseDeliveries } from "./faculty-course-service";
import { facultyProfileTeachingQuerySchema, pageOwnFacultyTeaching } from "./faculty-profile-teaching-model";

/** Only the signed-in persisted Faculty identity and current teaching deliveries. */
export async function getOwnFacultyTeachingSection(
  context: RequestContext, rawQuery: unknown,
) {
  const query=facultyProfileTeachingQuerySchema.parse(rawQuery);
  const membership=context.membership;
  if(!membership || !hasActiveMembership(context) ||
    !hasMembershipRole(context,"FACULTY") ||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    })) throw new AuthorizationError("courses.read");
  // This reader independently verifies real persisted self membership; the
  // legacy mixed Mentor/Admin profile is not substituted for a Faculty profile.
  const {person,profile}=await getOwnFacultyProfileWithRuntime(context);
  const deliveries=await listFacultyCourseDeliveries(context);
  return {
    title:person.user.displayName ?? person.user.email ?? "Faculty",
    academicTitle:profile?.academicTitle ?? null,
    employmentType:profile?.employmentType ?? null,
    query,
    ...pageOwnFacultyTeaching(deliveries,query),
  };
}
