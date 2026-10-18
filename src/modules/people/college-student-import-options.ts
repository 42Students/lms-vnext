import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, departments, programs, sections } from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/** Server-derived college choices: clients never have to type academic UUIDs. */
export async function listCollegeStudentImportOptions(context: RequestContext) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE") throw Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  // A stale session must not enumerate academic rosters after the acting
  // College Admin loses a role, membership or ACTIVE account status.
  return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"academics.manage",{
   collegeId:member.collegeId,organizationId:member.organizationId,
  });
  const db = tx;
  const programsList = await db.select({
    id: programs.id, name: programs.name,
  }).from(programs).innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(departments.collegeId, member.collegeId), eq(programs.status, "ACTIVE")))
    .orderBy(asc(programs.name)).limit(500);
  const batches = await db.select({
    id: cohorts.id, programId: cohorts.programId, name: cohorts.name,
  }).from(cohorts).innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    // Cohort startPeriodId is another independent foreign key, so verify
    // ownership rather than inferring it from the program's department.
    // Historical CLOSED start periods are valid for ongoing batches.
    .innerJoin(academicPeriods, eq(academicPeriods.id, cohorts.startPeriodId))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(academicPeriods.collegeId, member.collegeId),
      eq(programs.status,"ACTIVE"),
      inArray(cohorts.status, ["PLANNED", "ACTIVE"])))
    .orderBy(asc(cohorts.name)).limit(2000);
  const classes = await db.select({
    id: sections.id, cohortId: sections.cohortId, name: sections.name, capacity: sections.capacity,
  }).from(sections).innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .innerJoin(academicPeriods, eq(academicPeriods.id, sections.academicPeriodId))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(programs.status,"ACTIVE"),
      inArray(cohorts.status, ["PLANNED", "ACTIVE"]),
      eq(academicPeriods.collegeId, member.collegeId),
      ne(academicPeriods.status,"CLOSED"),
      eq(sections.status, "ACTIVE")))
    .orderBy(asc(sections.name)).limit(3000);
  return { programs: programsList, batches, classes };
  });
}
