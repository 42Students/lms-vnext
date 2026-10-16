import "server-only";
import { and, count, eq, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts, collegeMemberships, courses, departments, learnerProgramEnrollments,
  programs, sectionEnrollments, sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/** COL-dashboard-08: count actual missing relationships, rather than treating
 * an empty entire directory as a proxy for an individual setup gap. */
export async function getCollegeDashboardSetupGaps(context: RequestContext) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE") throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "academics.read", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const db = getDb();
  const [batchRows, sectionRows, studentRows, courseRows] = await Promise.all([
    db.select({ count: count() }).from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .leftJoin(sections, and(eq(sections.cohortId, cohorts.id), eq(sections.status, "ACTIVE")))
      .where(and(eq(departments.collegeId, member.collegeId),
        ne(cohorts.status, "ARCHIVED"), isNull(sections.id))),
    db.select({ count: count() }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .leftJoin(sectionEnrollments, and(eq(sectionEnrollments.sectionId, sections.id),
        eq(sectionEnrollments.status, "ACTIVE")))
      .where(and(eq(departments.collegeId, member.collegeId),
        eq(sections.status, "ACTIVE"), isNull(sectionEnrollments.id))),
    db.select({ count: count() }).from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships,
        eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
      .leftJoin(sectionEnrollments, and(
        eq(sectionEnrollments.learnerEnrollmentId, learnerProgramEnrollments.id),
        eq(sectionEnrollments.status, "ACTIVE")))
      .where(and(eq(collegeMemberships.collegeId, member.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(learnerProgramEnrollments.status, "ACTIVE"), isNull(sectionEnrollments.id))),
    db.select({ count: count() }).from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(eq(departments.collegeId, member.collegeId),
        eq(courses.status, "ACTIVE"),
        sql`not exists (
          select 1 from course_offerings co
          join course_learning_paths lp on lp.offering_id=co.id and lp.status <> 'ARCHIVED'
          join course_lessons cl on cl.learning_path_id=lp.id and cl.status = 'ACTIVE'
          where co.course_id = ${courses.id} and co.status='ACTIVE'
        )`)),
  ]);
  return [
    { label: "Batches without classes", count: batchRows[0]?.count ?? 0, href: "/college/batches" },
    { label: "Sections without students", count: sectionRows[0]?.count ?? 0, href: "/college/classes" },
    { label: "Students not in a class", count: studentRows[0]?.count ?? 0, href: "/college/students" },
    { label: "Courses without lessons", count: courseRows[0]?.count ?? 0, href: "/college/courses" },
  ];
}
