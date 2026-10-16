import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cohorts, departments, programs, sections } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/** Server-derived college choices: clients never have to type academic UUIDs. */
export async function listCollegeStudentImportOptions(context: RequestContext) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE") throw Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const db = getDb();
  const programsList = await db.select({
    id: programs.id, name: programs.name,
  }).from(programs).innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(departments.collegeId, member.collegeId), eq(programs.status, "ACTIVE")))
    .orderBy(asc(programs.name)).limit(500);
  const batches = await db.select({
    id: cohorts.id, programId: cohorts.programId, name: cohorts.name,
  }).from(cohorts).innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(departments.collegeId, member.collegeId),
      inArray(cohorts.status, ["PLANNED", "ACTIVE"])))
    .orderBy(asc(cohorts.name)).limit(2000);
  const classes = await db.select({
    id: sections.id, cohortId: sections.cohortId, name: sections.name, capacity: sections.capacity,
  }).from(sections).innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(departments.collegeId, member.collegeId), eq(sections.status, "ACTIVE")))
    .orderBy(asc(sections.name)).limit(3000);
  return { programs: programsList, batches, classes };
}
