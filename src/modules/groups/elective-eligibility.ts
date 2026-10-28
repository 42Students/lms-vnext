import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohortProgressionState, learnerProgramEnrollments, sectionEnrollments,
  sections, programs, departments, parseLegacyAcademicYearStart,
} from "@/db/schema";

/**
 * DB03 elective learner admission follows the executable legacy
 * ElectiveService.classEligibilityError rather than a historical migration
 * comment permitting cross-program selection. Current semester is the
 * persisted DB02 cohort progression state, NOT an academic period UUID.
 * Year mismatch rejects only if BOTH cohort and slot year are known.
 */
type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];
type Slot = {
  collegeId: string;
  programId: string;
  academicPeriodId: string | null;
  semesterNumber: number;
  academicYear: string | null;
};

export async function hasElectiveAcademicEligibility(
  tx: Tx,
  slot: Slot,
  membershipId: string,
): Promise<boolean> {
  const expectedYearStart = slot.academicYear === null
    ? null : parseLegacyAcademicYearStart(slot.academicYear);
  // Malformed legacy year must never silently broaden an elective roster.
  if (slot.academicYear !== null && expectedYearStart === null) return false;
  const [match] = await tx.select({ id: sectionEnrollments.id })
    .from(learnerProgramEnrollments)
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .innerJoin(
      sectionEnrollments,
      eq(sectionEnrollments.learnerEnrollmentId, learnerProgramEnrollments.id),
    )
    .innerJoin(sections, eq(sections.id, sectionEnrollments.sectionId))
    .innerJoin(cohortProgressionState,
      eq(cohortProgressionState.cohortId, learnerProgramEnrollments.cohortId))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membershipId),
      eq(departments.collegeId, slot.collegeId),
      eq(learnerProgramEnrollments.programId, slot.programId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
      eq(sectionEnrollments.status, "ACTIVE"),
      eq(sections.status, "ACTIVE"),
      eq(sections.cohortId, learnerProgramEnrollments.cohortId),
      eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
      eq(cohortProgressionState.currentTermNumber, slot.semesterNumber),
      expectedYearStart === null ? undefined : sql<boolean>`(
        ${cohortProgressionState.currentAcademicYearStart} IS NULL OR
        ${cohortProgressionState.currentAcademicYearStart} = ${expectedYearStart}
      )`,
      slot.academicPeriodId
        ? eq(sectionEnrollments.academicPeriodId, slot.academicPeriodId)
        : undefined,
    ))
    .limit(1);
  return Boolean(match);
}
