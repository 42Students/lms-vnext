import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { cohortProgressionState, cohorts, departments, programs } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";

export class CollegeBatchGraduationError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "CollegeBatchGraduationError"; }
}

/** "Mark graduated" closes the batch lifecycle only after the registered
 * last term. Historical enrolment rows are deliberately retained. */
export async function markCollegeBatchGraduated(
  context: RequestContext, cohortIdRaw: string, raw: unknown,
) {
  const cohortId = z.string().uuid().parse(cohortIdRaw);
  const input = z.object({ confirm: z.literal(true) }).strict().parse(raw);
  void input;
  const member = await resolveActingCollege(context, "academics.manage");
  return getDb().transaction(async tx => {
    const [row] = await tx.select({
      id: cohorts.id, name: cohorts.name, status: cohorts.status,
      collegeId: departments.collegeId, durationTerms: programs.durationTerms,
      currentTerm: cohortProgressionState.currentTermNumber,
    }).from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .leftJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
      .where(and(eq(cohorts.id, cohortId), eq(departments.collegeId, member.collegeId)))
      .for("update", { of: cohorts }).limit(1);
    if (!row) throw new CollegeBatchGraduationError("BATCH_NOT_FOUND");
    if (row.status === "COMPLETED") return { id: row.id, status: row.status };
    if (row.status !== "ACTIVE" || !row.currentTerm || row.currentTerm < row.durationTerms)
      throw new CollegeBatchGraduationError("BATCH_NOT_READY_TO_GRADUATE");
    const [saved] = await tx.update(cohorts).set({
      status: "COMPLETED", updatedAt: new Date(),
    }).where(and(eq(cohorts.id, row.id), eq(cohorts.status, "ACTIVE"))).returning();
    if (!saved) throw new CollegeBatchGraduationError("BATCH_GRADUATION_STALE");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_BATCH_UPDATED,
      collegeId: member.collegeId, organizationId: member.organizationId,
      subjectType: "cohort", subjectId: row.id, subjectLabel: row.name,
      summary: "Batch marked graduated",
      metadata: { previousStatus: row.status, status: saved.status, currentTerm: row.currentTerm },
    });
    return { id: saved.id, status: saved.status };
  });
}
