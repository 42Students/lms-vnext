import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicPeriods, sectionScheduleEvents, sections } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { collegePeriodLifecycleSchema, periodLifecycleBlocker } from "./college-period-lifecycle-model";
import { academicPeriodIdSchema } from "./validation";

export class CollegePeriodLifecycleError extends Error {
  constructor(public readonly code:
    "PERIOD_NOT_FOUND" | "PERIOD_STALE" | "PERIOD_HAS_OPEN_SECTIONS" | "PERIOD_HAS_SCHEDULED_SESSIONS",
  ) {
    super(code);
    this.name = "CollegePeriodLifecycleError";
  }
}

/** Confirmed and audited atomic period close/reopen. The period FOR UPDATE lock
 * serializes Section/Offering trigger ancestry checks (DB02 FOR SHARE). */
export async function changeCollegePeriodLifecycle(
  context: RequestContext,
  periodIdInput: unknown,
  raw: unknown,
) {
  const periodId = academicPeriodIdSchema.parse(periodIdInput);
  const input = collegePeriodLifecycleSchema.parse(raw);
  // College Admin membership or explicitly selected Super Admin college;
  // never fabricate a membership to satisfy a platform administrator.
  const acting = await resolveActingCollege(context, "academics.manage");
  return getDb().transaction(async tx => {
    const [period] = await tx.select({
      id: academicPeriods.id,
      name: academicPeriods.name,
      status: academicPeriods.status,
    }).from(academicPeriods).where(and(
      eq(academicPeriods.id, periodId),
      eq(academicPeriods.collegeId, acting.collegeId),
    )).for("update").limit(1);
    if (!period) throw new CollegePeriodLifecycleError("PERIOD_NOT_FOUND");
    const from = input.action === "CLOSE" ? "ACTIVE" : "CLOSED";
    const to = input.action === "CLOSE" ? "CLOSED" : "ACTIVE";
    if (period.status !== from) throw new CollegePeriodLifecycleError("PERIOD_STALE");

    const matchingSections = await tx.select({
      id: sections.id,
      status: sections.status,
    }).from(sections)
      .where(eq(sections.academicPeriodId, periodId)).for("update");
    const ids = matchingSections.map(item => item.id);
    // Inspect all scheduled sessions including those attached to non-active sections;
    // schedule status is authoritative and cannot be inferred from dates alone.
    const scheduled = ids.length
      ? await tx.select({ id: sectionScheduleEvents.id })
        .from(sectionScheduleEvents)
        .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
        .where(and(
          eq(sections.academicPeriodId, periodId),
          eq(sectionScheduleEvents.status, "SCHEDULED"),
        ))
        .limit(1)
      : [];
    const blocker = periodLifecycleBlocker(input.action, {
      openSections: matchingSections.filter(item => item.status === "ACTIVE").length,
      scheduledSessions: scheduled.length,
    });
    if (blocker) throw new CollegePeriodLifecycleError(blocker);

    const [updated] = await tx.update(academicPeriods).set({
      status: to, updatedAt: new Date(),
    }).where(and(
      eq(academicPeriods.id, period.id),
      eq(academicPeriods.collegeId, acting.collegeId),
      eq(academicPeriods.status, from),
    )).returning({id: academicPeriods.id, status: academicPeriods.status});
    if (!updated) throw new CollegePeriodLifecycleError("PERIOD_STALE");
    await recordActivityEventInTransaction(tx, context, {
      eventType: input.action === "CLOSE"
        ? ACTIVITY_EVENT_TYPES.ACADEMICS_PERIOD_CLOSED
        : ACTIVITY_EVENT_TYPES.ACADEMICS_PERIOD_REOPENED,
      collegeId: acting.collegeId,
      organizationId: acting.organizationId,
      subjectType: "ACADEMIC_PERIOD", subjectId: period.id,
      subjectLabel: period.name,
      summary: input.action === "CLOSE"
        ? "Academic period closed" : "Academic period reopened",
      metadata: { from, to },
    });
    return updated;
  });
}
