import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cohorts, departments, programs, programTerms, sections } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { loadAcademicCollegeScope } from "@/modules/academics/scope";
import { requirePermission } from "@/modules/permissions/policy";

export type ProgramContents = Readonly<{
  semesters: number;
  batches: number;
  classes: number;
}>;

/**
 * Counts persisted dependents of an already-authorized college's program list.
 * Includes archived child records: these still block permanent removal.
 */
export async function listProgramContents(
  context: RequestContext,
  collegeId: string,
  scopedProgramIds: readonly string[],
): Promise<Map<string, ProgramContents>> {
  const college = await loadAcademicCollegeScope(collegeId);
  // Program deletion readiness is an administrative view, not Faculty course metadata.
  requirePermission(context, "academics.manage", {
    collegeId,
    organizationId: college.organizationId,
  });
  if (scopedProgramIds.length === 0) return new Map();
  const db = getDb();
  const [termCounts, cohortCounts, sectionCounts] = await Promise.all([
    db.select({ programId: programTerms.programId, total: count() })
      .from(programTerms)
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(inArray(programTerms.programId, [...scopedProgramIds]),
        eq(departments.collegeId, collegeId)))
      .groupBy(programTerms.programId),
    db.select({ programId: cohorts.programId, total: count() })
      .from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(inArray(cohorts.programId, [...scopedProgramIds]),
        eq(departments.collegeId, collegeId)))
      .groupBy(cohorts.programId),
    db.select({ programId: cohorts.programId, total: count() })
      .from(sections).innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(inArray(cohorts.programId, [...scopedProgramIds]),
        eq(departments.collegeId, collegeId)))
      .groupBy(cohorts.programId),
  ]);
  const semesters = new Map(termCounts.map(row => [row.programId, row.total]));
  const batches = new Map(cohortCounts.map(row => [row.programId, row.total]));
  const classes = new Map(sectionCounts.map(row => [row.programId, row.total]));
  return new Map(scopedProgramIds.map(id => [id, {
    semesters: semesters.get(id) ?? 0,
    batches: batches.get(id) ?? 0,
    classes: classes.get(id) ?? 0,
  }]));
}
