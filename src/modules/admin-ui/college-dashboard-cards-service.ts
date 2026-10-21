import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { and, countDistinct, eq, isNull, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, cohorts, courses, departments, membershipRoles,
  programs, sections, users,
} from "@/db/schema";
import { getCollegeSetupChecklist } from "./college-setup-checklist-service";
import {
  collegeDashboardCardsProjection,
  collegeDashboardCardsQuerySchema,
} from "./college-dashboard-cards-model";

/** One authoritative registered-table count source. It already enforces
 * central can()/requirePermission() and own-college membership scope.
 * A database error rejects the entire response rather than fabricating 0. */
export async function getCollegeDashboardCards(
  context: RequestContext, rawQuery: unknown = {},
) {
  collegeDashboardCardsQuerySchema.parse(rawQuery);
  const result = await getCollegeSetupChecklist(context, {});
  // Setup totals include historic/disabled records for administrative tasks.
  // "At a glance" instead counts usable college records and active user
  // identities; a suspended account must never inflate an active headcount.
  // The checklist has already checked this actor's own-college admin scope.
  const collegeId = context.membership!.collegeId;
  const db = getDb();
  const [studentRows, facultyRows, courseRows, classRows] = await Promise.all([
    db.select({ total: countDistinct(collegeMemberships.id) })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
      .where(and(eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"), eq(users.platformStatus, "ACTIVE"),
        eq(membershipRoles.role, "LEARNER"))),
    db.select({ total: countDistinct(collegeMemberships.id) })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
      .where(and(eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"), eq(users.platformStatus, "ACTIVE"),
        eq(membershipRoles.role, "FACULTY"))),
    db.select({ total: countDistinct(courses.id) })
      .from(courses).innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(eq(departments.collegeId, collegeId), isNull(departments.archivedAt),
        eq(courses.status, "ACTIVE"), eq(courses.enabled, true), isNull(courses.deletedAt))),
    db.select({ total: countDistinct(sections.id) }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(eq(departments.collegeId, collegeId), isNull(departments.archivedAt),
        eq(programs.status, "ACTIVE"), ne(cohorts.status, "ARCHIVED"),
        eq(sections.status, "ACTIVE"))),
  ]);
  const cardCounts = {
    ...result.counts,
    students: studentRows[0]?.total ?? 0,
    faculty: facultyRows[0]?.total ?? 0,
    "course-list": courseRows[0]?.total ?? 0,
    classes: classRows[0]?.total ?? 0,
  };
  return { setup: result, cards: collegeDashboardCardsProjection(cardCounts) };
}
