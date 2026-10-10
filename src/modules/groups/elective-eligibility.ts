import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  learnerProgramEnrollments, sectionEnrollments, sections, programs, departments,
} from "@/db/schema";

/**
 * DB03 elective student eligibility. Legacy ElectiveService.classEligibilityError
 * explicitly requires the primary section's program to equal the slot's program.
 * The older V167 migration comment suggesting cross-program allocation conflicts
 * with that executed service contract; follow the service for clone parity.
 * Semester/year remain tracked DB02 blockers: period equality does not prove them.
 */
type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];
type Slot = { collegeId: string; programId: string; academicPeriodId: string | null };

export async function hasElectiveAcademicEligibility(
  tx: Tx,
  slot: Slot,
  membershipId: string,
): Promise<boolean> {
  const [match] = await tx.select({ id: sectionEnrollments.id })
    .from(learnerProgramEnrollments)
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .innerJoin(
      sectionEnrollments,
      eq(sectionEnrollments.learnerEnrollmentId, learnerProgramEnrollments.id),
    )
    .innerJoin(sections, eq(sections.id, sectionEnrollments.sectionId))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membershipId),
      // Legacy ElectiveService.classEligibilityError rejects a primary section
      // outside the slot's program (regardless of the broader migration comment).
      eq(departments.collegeId, slot.collegeId),
      eq(learnerProgramEnrollments.programId, slot.programId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
      eq(sectionEnrollments.status, "ACTIVE"),
      eq(sections.status, "ACTIVE"),
      eq(sections.cohortId, learnerProgramEnrollments.cohortId),
      eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
      slot.academicPeriodId
        ? eq(sectionEnrollments.academicPeriodId, slot.academicPeriodId)
        : undefined,
    ))
    .limit(1);
  return Boolean(match);
}
