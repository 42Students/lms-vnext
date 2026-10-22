import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { courseOfferingIdSchema } from "@/modules/courses/validation";
import { loadCourseOfferingScope } from "@/modules/courses/scope";
import { CoursesServiceError } from "@/modules/courses/errors";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { resourceVisibleInAdminScope } from "./super-admin-resource-scope-model";

/** Absent/invalid and foreign-safety-scope offerings both render not-found. */
export async function resolveSuperAdminOfferingDetail(context: RequestContext, rawId: unknown) {
  requirePermission(context, "courses.manage", {
    ...(context.adminScope?.collegeId !== undefined ? {collegeId: context.adminScope.collegeId} : {}),
    ...(context.adminScope?.organizationId !== undefined ? {organizationId: context.adminScope.organizationId} : {}),
  });
  const id = courseOfferingIdSchema.safeParse(rawId);
  if (!id.success || !context.adminScope?.collegeId) return null;
  try {
    const offering = await loadCourseOfferingScope(id.data);
    if (!resourceVisibleInAdminScope(context.adminScope, offering)) return null;
    requirePermission(context, "courses.manage", {
      collegeId: offering.collegeId, organizationId: offering.organizationId,
    });
    return offering;
  } catch (error) {
    if (error instanceof CoursesServiceError && (
      error.code === "OFFERING_NOT_FOUND" ||
      error.code === "COURSE_NOT_FOUND"
    )) return null;
    if (error instanceof AcademicsServiceError && (
      error.code === "COHORT_NOT_FOUND" || error.code === "ACADEMIC_PERIOD_NOT_FOUND"
    )) return null;
    throw error;
  }
}
