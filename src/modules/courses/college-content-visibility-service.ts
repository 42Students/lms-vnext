import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, courseLearningPaths, courseLessons, courseOfferings,
  courses, departments, lessonContents, programs } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { lessonVisibilityCommandSchema } from "./faculty-lesson-visibility-model";
import { CoursesServiceError } from "./errors";

const programDepartment=alias(departments,"visibility_program_department");

export async function updateCollegeContentStudentVisibility(context:RequestContext,raw:unknown){
  const input=lessonVisibilityCommandSchema.parse(raw);
  const member=context.membership;
  if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN"))
    throw new AuthorizationError("courses.manage");
  const scope={collegeId:member.collegeId,organizationId:member.organizationId};
  requirePermission(context,"courses.manage",scope);
  return getDb().transaction(async tx=>{
    const [content]=await tx.select({
      id:lessonContents.id,title:lessonContents.title,status:lessonContents.status,
      updatedAt:lessonContents.updatedAt,visible:lessonContents.visibleToStudents,
    }).from(lessonContents)
      .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
      .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
      .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
      .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
      .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,scope.collegeId)))
      .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(programDepartment,and(eq(programDepartment.id,programs.departmentId),eq(programDepartment.collegeId,scope.collegeId)))
      .innerJoin(academicPeriods,and(eq(academicPeriods.id,courseOfferings.academicPeriodId),
        eq(academicPeriods.collegeId,scope.collegeId)))
      .where(eq(lessonContents.id,input.lessonContentId))
      .for("update",{of:lessonContents}).limit(1);
    if(!content||content.status==="ARCHIVED")throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
    const persisted=await assertPersistedPlatformPermission(tx,context,"courses.manage",scope);
    if(!hasMembershipRole(persisted,"COLLEGE_ADMIN"))
      throw new AuthorizationError("courses.manage");
    const [updated]=await tx.update(lessonContents).set({
      visibleToStudents:input.visibleToStudents,
      updatedAt:sql<Date>`greatest(${lessonContents.updatedAt} + interval '1 millisecond',clock_timestamp())`,
    }).where(and(eq(lessonContents.id,content.id),
      sql`date_trunc('milliseconds',${lessonContents.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`
    )).returning({id:lessonContents.id,visibleToStudents:lessonContents.visibleToStudents,
      updatedAt:lessonContents.updatedAt});
    if(!updated)throw new CoursesServiceError("LESSON_CONTENT_STALE_VERSION");
    await recordActivityEventInTransaction(tx,persisted,{
      eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_CONTENT_VISIBILITY_CHANGED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"lesson_content",subjectId:updated.id,subjectLabel:content.title,
      summary:updated.visibleToStudents?"Student visibility enabled":"Student visibility disabled",
      metadata:{before:content.visible,after:updated.visibleToStudents},
    });
    return updated;
  });
}
