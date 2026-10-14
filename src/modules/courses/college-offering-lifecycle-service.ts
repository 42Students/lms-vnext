import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courseOfferings, courses, departments, cohorts, programs, academicPeriods } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { archiveCourseOffering } from "./offering-service";
import { postgresConstraintName } from "./errors";
import { collegeOfferingLifecycleIdSchema, collegeOfferingLifecycleSchema } from "./college-offering-lifecycle-model";

export class CollegeOfferingLifecycleError extends Error {
  constructor(public readonly code: "OFFERING_NOT_FOUND" | "OFFERING_STATE_CHANGED" |
    "OFFERING_PARENT_UNAVAILABLE" | "OFFERING_ACTIVE_DUPLICATE") {
    super(code); this.name = "CollegeOfferingLifecycleError";
  }
}

export async function changeCollegeOfferingLifecycle(context: RequestContext, rawId: unknown, raw: unknown) {
  const id = collegeOfferingLifecycleIdSchema.parse(rawId);
  const input = collegeOfferingLifecycleSchema.parse(raw);
  const member = context.membership;
  if (!member || member.status !== "ACTIVE" || !hasMembershipRole(context,"COLLEGE_ADMIN") ||
    !can(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId}))
    throw new AuthorizationError("courses.manage");
  requirePermission(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId});

  const [owned] = await getDb().select({id:courseOfferings.id,status:courseOfferings.status})
    .from(courseOfferings).innerJoin(courses,eq(courses.id,courseOfferings.courseId))
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .where(and(eq(courseOfferings.id,id),eq(departments.collegeId,member.collegeId))).limit(1);
  if (!owned) throw new CollegeOfferingLifecycleError("OFFERING_NOT_FOUND");
  if (owned.status !== input.expectedStatus) throw new CollegeOfferingLifecycleError("OFFERING_STATE_CHANGED");

  if (input.action === "ARCHIVE") {
    // Existing writer locks the offering, blocks active Section deliveries,
    // and persists an immutable activity event inside the update transaction.
    return archiveCourseOffering(context,id);
  }
  try {
    return await getDb().transaction(async tx => {
      const [current] = await tx.select({
        id:courseOfferings.id,status:courseOfferings.status,courseId:courseOfferings.courseId,
        cohortId:courseOfferings.cohortId,periodId:courseOfferings.academicPeriodId,
        courseStatus:courses.status,
      }).from(courseOfferings).innerJoin(courses,eq(courses.id,courseOfferings.courseId))
        .innerJoin(departments,and(eq(departments.id,courses.departmentId),
          eq(departments.collegeId,member.collegeId)))
        .where(eq(courseOfferings.id,id)).for("update",{of:courseOfferings}).limit(1);
      if (!current) throw new CollegeOfferingLifecycleError("OFFERING_NOT_FOUND");
      if (current.status !== "ARCHIVED") throw new CollegeOfferingLifecycleError("OFFERING_STATE_CHANGED");

      const [cohort] = await tx.select({id:cohorts.id,status:cohorts.status})
        .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
        .innerJoin(departments,and(eq(departments.id,programs.departmentId),
          eq(departments.collegeId,member.collegeId)))
        .where(eq(cohorts.id,current.cohortId)).for("share",{of:cohorts}).limit(1);
      const [period] = await tx.select({id:academicPeriods.id,status:academicPeriods.status})
        .from(academicPeriods).where(and(eq(academicPeriods.id,current.periodId),
          eq(academicPeriods.collegeId,member.collegeId))).for("share").limit(1);
      if (!cohort || !period) throw new CollegeOfferingLifecycleError("OFFERING_NOT_FOUND");
      if (current.courseStatus !== "ACTIVE" || !["PLANNED","ACTIVE"].includes(cohort.status) ||
        period.status === "CLOSED") throw new CollegeOfferingLifecycleError("OFFERING_PARENT_UNAVAILABLE");

      const [duplicate] = await tx.select({id:courseOfferings.id}).from(courseOfferings)
        .where(and(eq(courseOfferings.courseId,current.courseId),
          eq(courseOfferings.cohortId,current.cohortId),
          eq(courseOfferings.academicPeriodId,current.periodId),
          eq(courseOfferings.status,"ACTIVE"),ne(courseOfferings.id,id))).limit(1);
      if (duplicate) throw new CollegeOfferingLifecycleError("OFFERING_ACTIVE_DUPLICATE");
      const [updated] = await tx.update(courseOfferings).set({status:"ACTIVE",updatedAt:new Date()})
        .where(and(eq(courseOfferings.id,id),eq(courseOfferings.status,"ARCHIVED")))
        .returning({id:courseOfferings.id,status:courseOfferings.status});
      if (!updated) throw new CollegeOfferingLifecycleError("OFFERING_STATE_CHANGED");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.COURSES_OFFERING_RESTORED,
        collegeId:member.collegeId,organizationId:member.organizationId,
        subjectType:"course_offering",subjectId:id,summary:"College Admin restored course offering",
        metadata:{courseId:current.courseId,fromStatus:"ARCHIVED",toStatus:"ACTIVE"},
      });
      return updated;
    });
  } catch (error) {
    if (postgresConstraintName(error) === "course_offerings_active_uq")
      throw new CollegeOfferingLifecycleError("OFFERING_ACTIVE_DUPLICATE");
    throw error;
  }
}
