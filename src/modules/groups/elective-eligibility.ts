import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  learnerProgramEnrollments, sectionEnrollments, sections, programs, departments,
} from "@/db/schema";

/**
 * DB03 elective student eligibility. Legacy requires a valid primary program
 * enrollment in the SAME COLLEGE (not necessarily the slot's program) and a
 * valid primary section. Semester/year remain
 * a separate tracked DB02 contract: never pretend period equality proves it.
 */
type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];
type Slot = { collegeId: string; academicPeriodId: string | null };

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
      // Legacy electives permit learners from OTHER programs in the same
      // college: the curriculum slot program is NOT an enrollment restriction.
      eq(departments.collegeId, slot.collegeId),
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
