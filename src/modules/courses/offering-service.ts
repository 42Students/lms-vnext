import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import {z} from "zod";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  academicPeriods,
  cohorts,
  colleges,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  departments,
  organizations,
  programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  loadAcademicPeriodScope,
  loadCohortScope,
} from "@/modules/academics/scope";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseOfferingScope,
  loadCourseScope,
} from "./scope";
import {
  cohortIdSchema,
  academicPeriodIdSchema,
} from "@/modules/academics/validation";
import {
  courseOfferingIdSchema,
  createCourseOfferingInputSchema,
  updateCourseOfferingInputSchema,
  type CreateCourseOfferingInput,
  type UpdateCourseOfferingInput,
} from "./validation";

function mapOfferingConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "course_offerings_active_uq"
  ) {
    return new CoursesServiceError(
      "OFFERING_CONFLICT",
    );
  }

  return error;
}

async function validateOfferingStructure(input: {
  courseId: string;
  cohortId: string;
  academicPeriodId: string;
}) {
  const [course, cohort, period] =
    await Promise.all([
      loadCourseScope(input.courseId),
      loadCohortScope(input.cohortId),
      loadAcademicPeriodScope(
        input.academicPeriodId,
      ),
    ]);

  if (
    course.collegeId !== cohort.collegeId ||
    course.collegeId !== period.collegeId
  ) {
    throw new CoursesServiceError(
      "COURSE_COLLEGE_MISMATCH",
    );
  }

  if (
    cohort.status !== "PLANNED" &&
    cohort.status !== "ACTIVE"
  ) {
    throw new CoursesServiceError(
      "COHORT_NOT_MUTABLE",
    );
  }

  if (period.status === "CLOSED") {
    throw new CoursesServiceError(
      "ACADEMIC_PERIOD_CLOSED",
    );
  }

  const startPeriod =
    await loadAcademicPeriodScope(
      cohort.startPeriodId,
    );

  if (period.startDate < startPeriod.startDate) {
    throw new CoursesServiceError(
      "OFFERING_COHORT_PERIOD_MISMATCH",
    );
  }

  if (cohort.expectedEndPeriodId) {
    const endPeriod =
      await loadAcademicPeriodScope(
        cohort.expectedEndPeriodId,
      );

    if (period.endDate > endPeriod.endDate) {
      throw new CoursesServiceError(
        "OFFERING_COHORT_PERIOD_MISMATCH",
      );
    }
  }

  return { course };
}

export async function listCourseOfferings(
  context: RequestContext,
  cohortIdInput: string,
  academicPeriodIdInput?: string | null,
  includeArchived = false,
) {
  const cohortId =
    cohortIdSchema.parse(cohortIdInput);
  const cohort = await loadCohortScope(cohortId);

  requirePermission(context, "courses.read", {
    organizationId: cohort.organizationId,
    collegeId: cohort.collegeId,
  });

  const academicPeriodId =
    academicPeriodIdInput
      ? academicPeriodIdSchema.parse(
          academicPeriodIdInput,
        )
      : null;

  if (academicPeriodId) {
    const period =
      await loadAcademicPeriodScope(
        academicPeriodId,
      );

    if (period.collegeId !== cohort.collegeId) {
      throw new CoursesServiceError(
        "OFFERING_COHORT_PERIOD_MISMATCH",
      );
    }
  }

  const conditions = [
    eq(courseOfferings.cohortId, cohortId),
  ];

  if (academicPeriodId) {
    conditions.push(
      eq(
        courseOfferings.academicPeriodId,
        academicPeriodId,
      ),
    );
  }

  if (!includeArchived) {
    conditions.push(
      eq(courseOfferings.status, "ACTIVE"),
    );
  }

  return getDb()
    .select({
      id: courseOfferings.id,
      courseId: courseOfferings.courseId,
      courseName: courses.name,
      courseCode: courses.code,
      cohortId: courseOfferings.cohortId,
      academicPeriodId:
        courseOfferings.academicPeriodId,
      academicPeriodName: academicPeriods.name,
      type: courseOfferings.type,
      credits: courseOfferings.credits,
      displayOrder: courseOfferings.displayOrder,
      status: courseOfferings.status,
      createdAt: courseOfferings.createdAt,
      updatedAt: courseOfferings.updatedAt,
    })
    .from(courseOfferings)
    .innerJoin(
      courses,
      eq(courses.id, courseOfferings.courseId),
    )
    .innerJoin(
      academicPeriods,
      eq(
        academicPeriods.id,
        courseOfferings.academicPeriodId,
      ),
    )
    .where(and(...conditions))
    .orderBy(
      asc(courseOfferings.displayOrder),
      asc(courses.name),
    );
}

export async function createCourseOffering(
  context: RequestContext,
  rawInput: CreateCourseOfferingInput,
) {
  const input =
    createCourseOfferingInputSchema.parse(
      rawInput,
    );
  const { course } =
    await validateOfferingStructure(input);

  requirePermission(context, "courses.manage", {
    organizationId: course.organizationId,
    collegeId: course.collegeId,
  });

  try {
    return await getDb().transaction(async (tx) => {
      // The initial course scope read precedes this transaction and can
      // race with course archival. Lock and recheck inside the INSERT tx.
      // SHARE conflicts with the course archive's FOR UPDATE.
      const [activeCourse] = await tx
        .select({
          id: courses.id,
          collegeId: departments.collegeId,
        })
        .from(courses)
        .innerJoin(
          departments,
          eq(departments.id, courses.departmentId),
        )
        .innerJoin(
          colleges,
          eq(colleges.id, departments.collegeId),
        )
        .innerJoin(
          organizations,
          eq(organizations.id, colleges.organizationId),
        )
        .where(and(
          eq(courses.id, input.courseId),
          eq(courses.status, "ACTIVE"),
          isNull(departments.archivedAt),
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ))
        .for("share")
        .limit(1);

      if (!activeCourse) {
        throw new CoursesServiceError("COURSE_NOT_FOUND");
      }
      if (activeCourse.collegeId !== course.collegeId) {
        // Authorization was evaluated for the earlier course college.
        // Never let a concurrent department move reuse that stale grant.
        throw new CoursesServiceError("COURSE_COLLEGE_MISMATCH");
      }

      // The preliminary cohort/period validation ran before this transaction.
      // Re-read and SHARE-lock every mutable parent whose status, dates or
      // college might change before the offering INSERT commits.
      const [lockedCohort] = await tx
        .select({
          id: cohorts.id,
          status: cohorts.status,
          collegeId: departments.collegeId,
          startPeriodId: cohorts.startPeriodId,
          expectedEndPeriodId: cohorts.expectedEndPeriodId,
        })
        .from(cohorts)
        .innerJoin(
          programs,
          eq(programs.id, cohorts.programId),
        )
        .innerJoin(
          departments,
          eq(departments.id, programs.departmentId),
        )
        .where(and(
          eq(cohorts.id, input.cohortId),
          eq(programs.status, "ACTIVE"),
          isNull(departments.archivedAt),
        ))
        .for("share")
        .limit(1);

      if (!lockedCohort ||
          (lockedCohort.status !== "PLANNED" &&
           lockedCohort.status !== "ACTIVE")) {
        throw new CoursesServiceError("COHORT_NOT_MUTABLE");
      }

      if (lockedCohort.collegeId !== activeCourse.collegeId) {
        throw new CoursesServiceError("COURSE_COLLEGE_MISMATCH");
      }

      // Stable ID ordering reduces parent-row lock inversions when multiple
      // offerings reference the same academic periods in different roles.
      const periodIds = [...new Set([
        input.academicPeriodId,
        lockedCohort.startPeriodId,
        ...(lockedCohort.expectedEndPeriodId
          ? [lockedCohort.expectedEndPeriodId]
          : []),
      ])].sort();
      const lockedPeriods = await tx
        .select({
          id: academicPeriods.id,
          collegeId: academicPeriods.collegeId,
          status: academicPeriods.status,
          startDate: academicPeriods.startDate,
          endDate: academicPeriods.endDate,
        })
        .from(academicPeriods)
        .where(inArray(academicPeriods.id, periodIds))
        .orderBy(asc(academicPeriods.id))
        .for("share");

      const periodById = new Map(
        lockedPeriods.map((period) => [period.id, period]),
      );
      const chosenPeriod = periodById.get(input.academicPeriodId);
      const startPeriod = periodById.get(lockedCohort.startPeriodId);
      const endPeriod = lockedCohort.expectedEndPeriodId
        ? periodById.get(lockedCohort.expectedEndPeriodId)
        : null;

      if (!chosenPeriod || !startPeriod ||
          (lockedCohort.expectedEndPeriodId && !endPeriod) ||
          lockedPeriods.some((period) =>
            period.collegeId !== activeCourse.collegeId)) {
        throw new CoursesServiceError("COURSE_COLLEGE_MISMATCH");
      }
      if (chosenPeriod.status === "CLOSED") {
        throw new CoursesServiceError("ACADEMIC_PERIOD_CLOSED");
      }
      if (chosenPeriod.startDate < startPeriod.startDate ||
          (endPeriod && chosenPeriod.endDate > endPeriod.endDate)) {
        throw new CoursesServiceError("OFFERING_COHORT_PERIOD_MISMATCH");
      }

      const [ordering] = input.displayOrder===0 ? await tx.select({
        max:sql<number>`coalesce(max(${courseOfferings.displayOrder}),-1)::int`,
      }).from(courseOfferings).where(and(
        eq(courseOfferings.cohortId,input.cohortId),
        eq(courseOfferings.academicPeriodId,input.academicPeriodId),
        eq(courseOfferings.status,"ACTIVE"),
      )) : [{max:-1}];
      const appendOrder=input.displayOrder===0?Number(ordering?.max??-1)+1:input.displayOrder;
      if(appendOrder>10000)throw new CoursesServiceError("OFFERING_CONFLICT");
      const [created] = await tx
        .insert(courseOfferings)
        .values({
          courseId: input.courseId,
          cohortId: input.cohortId,
          academicPeriodId:
            input.academicPeriodId,
          type: input.type,
          credits: input.credits ?? null,
          displayOrder: appendOrder,
        })
        .returning();

      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_OFFERING_CREATED,
        collegeId: course.collegeId,
        organizationId: course.organizationId,
        subjectType: "course_offering",
        subjectId: created.id,
        summary: "Course offering created",
        metadata: {
          courseId: input.courseId, cohortId: input.cohortId,
          academicPeriodId: input.academicPeriodId,
          type: input.type, credits: input.credits ?? null,
        },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapOfferingConstraint(error);
  }
}

export async function updateCourseOffering(
  context: RequestContext,
  offeringIdInput: string,
  rawInput: UpdateCourseOfferingInput,
) {
  const offeringId =
    courseOfferingIdSchema.parse(
      offeringIdInput,
    );
  const input =
    updateCourseOfferingInputSchema.parse(
      rawInput,
    );
  const current =
    await loadCourseOfferingScope(offeringId);

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  if (
    current.periodStatus === "CLOSED" ||
    (current.cohortStatus !== "PLANNED" &&
      current.cohortStatus !== "ACTIVE")
  ) {
    throw new CoursesServiceError(
      "OFFERING_NOT_MUTABLE",
    );
  }

  // Keep the offering mutable-status decision inside the same transaction
  // as the write. Without this recheck, a cohort or academic period can
  // close after loadCourseOfferingScope but before the update commits.
  return getDb().transaction(async (tx) => {
    const [lockedOffering] = await tx
      .select({
        id: courseOfferings.id,
        cohortId: courseOfferings.cohortId,
        academicPeriodId: courseOfferings.academicPeriodId,
      })
      .from(courseOfferings)
      .where(and(
        eq(courseOfferings.id, offeringId),
        eq(courseOfferings.status, "ACTIVE"),
        eq(courseOfferings.courseId, current.courseId),
        eq(courseOfferings.cohortId, current.cohortId),
        eq(courseOfferings.academicPeriodId, current.academicPeriodId),
      ))
      .for("update")
      .limit(1);

    if (!lockedOffering) {
      throw new CoursesServiceError("OFFERING_NOT_FOUND");
    }

    // Guard against an ancestor course/department move invalidating the
    // college used for the original authorization decision. SHARE locks
    // both rows for this transaction; it does not replace DB02 upstream
    // guards or direct-SQL PostgreSQL race acceptance.
    const [lockedCourse] = await tx
      .select({
        id: courses.id,
        status: courses.status,
        collegeId: departments.collegeId,
      })
      .from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(eq(courses.id, current.courseId))
      .for("share")
      .limit(1);

    if (
      !lockedCourse ||
      lockedCourse.status !== "ACTIVE" ||
      lockedCourse.collegeId !== current.collegeId
    ) {
      throw new CoursesServiceError("COURSE_COLLEGE_MISMATCH");
    }

    const [lockedCohort] = await tx
      .select({
        id: cohorts.id,
        status: cohorts.status,
        collegeId: departments.collegeId,
      })
      .from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(eq(cohorts.id, lockedOffering.cohortId))
      .for("share")
      .limit(1);

    const [lockedPeriod] = await tx
      .select({
        id: academicPeriods.id,
        status: academicPeriods.status,
        collegeId: academicPeriods.collegeId,
      })
      .from(academicPeriods)
      .where(eq(academicPeriods.id, lockedOffering.academicPeriodId))
      .for("share")
      .limit(1);

    if (
      !lockedCohort ||
      !lockedPeriod ||
      lockedCohort.collegeId !== current.collegeId ||
      lockedPeriod.collegeId !== current.collegeId
    ) {
      throw new CoursesServiceError("COURSE_COLLEGE_MISMATCH");
    }

    if (
      lockedPeriod.status === "CLOSED" ||
      (lockedCohort.status !== "PLANNED" &&
       lockedCohort.status !== "ACTIVE")
    ) {
      throw new CoursesServiceError("OFFERING_NOT_MUTABLE");
    }

    const [updated] = await tx
      .update(courseOfferings)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseOfferings.id, offeringId),
        eq(courseOfferings.status, "ACTIVE"),
        eq(courseOfferings.courseId, current.courseId),
        eq(courseOfferings.cohortId, current.cohortId),
        eq(courseOfferings.academicPeriodId, current.academicPeriodId),
      ))
      .returning();

    if (!updated) {
      throw new CoursesServiceError("OFFERING_NOT_FOUND");
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_OFFERING_UPDATED,
      collegeId: current.collegeId,
      organizationId: current.organizationId,
      subjectType: "course_offering",
      subjectId: updated.id,
      summary: "Course offering details updated",
      metadata: { type: updated.type, credits: updated.credits, displayOrder: updated.displayOrder },
    });
    return updated;
  });
}

export async function archiveCourseOffering(
  context: RequestContext,
  offeringIdInput: string,
) {
  const offeringId =
    courseOfferingIdSchema.parse(
      offeringIdInput,
    );
  const current =
    await loadCourseOfferingScope(offeringId);

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  // FK KEY SHARE on offering for a new delivery conflicts with FOR UPDATE.
  // Hold the parent lock from the child check through the archive UPDATE.
  return getDb().transaction(async (tx) => {
    const [lockedOffering] = await tx
      .select({ id: courseOfferings.id })
      .from(courseOfferings)
      .where(and(
        eq(courseOfferings.id, offeringId),
        eq(courseOfferings.status, "ACTIVE"),
        eq(courseOfferings.courseId, current.courseId),
        eq(courseOfferings.cohortId, current.cohortId),
        eq(courseOfferings.academicPeriodId, current.academicPeriodId),
      ))
      .for("update")
      .limit(1);

    if (!lockedOffering) {
      throw new CoursesServiceError("OFFERING_NOT_FOUND");
    }

    const [delivery] = await tx
      .select({ id: courseSectionDeliveries.id })
      .from(courseSectionDeliveries)
      .where(and(
        eq(courseSectionDeliveries.offeringId, offeringId),
        isNull(courseSectionDeliveries.endedAt),
      ))
      .limit(1);

    if (delivery) {
      throw new CoursesServiceError("OFFERING_HAS_ACTIVE_DELIVERIES");
    }

    const [archived] = await tx
      .update(courseOfferings)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseOfferings.id, offeringId),
        eq(courseOfferings.status, "ACTIVE"),
        eq(courseOfferings.courseId, current.courseId),
        eq(courseOfferings.cohortId, current.cohortId),
        eq(courseOfferings.academicPeriodId, current.academicPeriodId),
      ))
      .returning();

    if (!archived) {
      throw new CoursesServiceError("OFFERING_NOT_FOUND");
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_OFFERING_ARCHIVED,
      collegeId: current.collegeId,
      organizationId: current.organizationId,
      subjectType: "course_offering",
      subjectId: archived.id,
      summary: "Course offering archived",
      metadata: { courseId: current.courseId, cohortId: current.cohortId },
    });
    return archived;
  });
}

/** Legacy semester-course assignment maps to a particular cohort + academic
 * period offering in the new membership/period model; it does NOT mutate
 * every course section delivery implicitly. Callers must first resolve the
 * semester mapping, choose the matching cohort and period, then invoke the
 * existing permission-checked createCourseOffering transaction for each
 * authorized item. Course deliveries require a separate explicit action.
 */
export function offeringDraftFromSemesterCourseMapping(input:{
 courseId:string;cohortId:string;academicPeriodId:string;
 type:CreateCourseOfferingInput["type"];
 credits:CreateCourseOfferingInput["credits"];
 displayOrder:CreateCourseOfferingInput["displayOrder"];
}):CreateCourseOfferingInput{
 return createCourseOfferingInputSchema.parse(input);
}


/** Legacy semester-course bulk append. Semester IDs are NOT interchangeable
 * with a cohort and academic period UUID; the caller must supply both.
 * Each row receives its own transaction and authorization check. Existing
 * assignments are reported as skipped, never overwritten or physically
 * removed. A failed row does not undo prior successfully assigned courses.
 */
export const semesterCourseBulkAddSchema=z.strictObject({
 courseIds:z.array(z.uuid()).min(1).max(100)
  .refine(ids=>new Set(ids).size===ids.length,"Duplicate course IDs"),
 cohortId:z.uuid(),academicPeriodId:z.uuid(),
 type:createCourseOfferingInputSchema.shape.type,
 credits:createCourseOfferingInputSchema.shape.credits,
});
export async function addCoursesToSemester(
 context:RequestContext,raw:unknown,
){
 const input=semesterCourseBulkAddSchema.parse(raw);
 const existing=await listCourseOfferings(context,input.cohortId,input.academicPeriodId,true);
 const already=new Set(existing.filter(row=>row.status==="ACTIVE").map(row=>row.courseId));
 const added:string[]=[],skipped:string[]=[],failed:Array<{courseId:string;reason:string}>=[];
 for(const id of input.courseIds){
  if(already.has(id)){skipped.push(id);continue;}
  try{
   const created=await createCourseOffering(context,{
    courseId:id,cohortId:input.cohortId,academicPeriodId:input.academicPeriodId,
    type:input.type,credits:input.credits??null,displayOrder:0,
   });
   added.push(created.id);already.add(id);
  }catch(error){
   if(error instanceof CoursesServiceError&&error.code==="OFFERING_CONFLICT"){
    skipped.push(id);already.add(id);continue;
   }
   // Do not expose tenant-specific database identifiers/rejection details.
   failed.push({courseId:id,reason:error instanceof CoursesServiceError?error.code:"NOT_ASSIGNED"});
  }
 }
 return {requested:input.courseIds.length,added,skipped,failed,
  message:"Assigned "+added.length+" of "+input.courseIds.length+" courses to the selected semester mapping"};
}

/** Preview exactly which active course offerings would be soft-unlinked.
 * Historical teaching deliveries and grades remain intact; a delivery may
 * block one archival, with the failure explicitly reported to the caller. */
export const semesterCourseBulkRemoveSchema=z.strictObject({
 cohortId:z.uuid(),academicPeriodId:z.uuid(),
 confirm:z.literal(true),limit:z.number().int().min(1).max(100).default(100),
});
export async function removeAllCoursesFromSemester(
 context:RequestContext,raw:unknown,
){
 const input=semesterCourseBulkRemoveSchema.parse(raw);
 const rows=await listCourseOfferings(context,input.cohortId,input.academicPeriodId);
 const archived:string[]=[],failed:Array<{offeringId:string;reason:string}>=[];
 const slice=rows.slice(0,input.limit);
 for(const row of slice){
  try{
   await archiveCourseOffering(context,row.id);
   archived.push(row.id);
  }catch(error){
   failed.push({offeringId:row.id,reason:error instanceof CoursesServiceError?
    error.code:"ARCHIVE_FAILED"});
  }
 }
 return {matched:rows.length,processed:slice.length,archived,failed,
  hasMore:rows.length>slice.length,
  semantics:"SOFT_ARCHIVE_NOT_PHYSICAL_DELETE" as const};
}
