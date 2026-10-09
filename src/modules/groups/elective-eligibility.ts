import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  learnerProgramEnrollments, sectionEnrollments, sections,
} from "@/db/schema";

/**
 * DB03 elective student eligibility. Legacy requires current program and a
 * valid primary section, plus semester/year alignment. Semester/year remain
 * a separate tracked DB02 contract: never pretend period equality proves it.
 */
type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];
type Slot = { programId: string; academicPeriodId: string | null };

export async function hasElectiveAcademicEligibility(
  tx: Tx,
  slot: Slot,
  membershipId: string,
): Promise<boolean> {
  const [match] = await tx.select({ id: sectionEnrollments.id })
    .from(learnerProgramEnrollments)
    .innerJoin(
      sectionEnrollments,
      eq(sectionEnrollments.learnerEnrollmentId, learnerProgramEnrollments.id),
    )
    .innerJoin(sections, eq(sections.id, sectionEnrollments.sectionId))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membershipId),
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
