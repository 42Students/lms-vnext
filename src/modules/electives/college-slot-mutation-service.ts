import "server-only";

import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  academicPeriods, departments, electiveOfferings,
  electiveSlots, lmsGroupMembers, programs,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { assertPersistedGroupActor } from "@/modules/groups/actor-access";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import {assertCollegeElectivesEnabled} from "./college-elective-module-guard";
import {
  createCollegeElectiveSlotSchema, editCollegeElectiveSlotSchema,
  normalizeSlotYear, slotSelectionChanged,
} from "./college-slot-mutation-model";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type TxRunner = <T>(cb: (tx: Tx) => Promise<T>) => Promise<T>;

export class CollegeElectiveSlotMutationError extends Error {
  constructor(public readonly code:
    "ELECTIVE_SLOT_NOT_FOUND" | "ELECTIVE_PROGRAM_NOT_FOUND" |
    "ELECTIVE_PERIOD_INVALID" | "ELECTIVE_SEMESTER_INVALID" |
    "ELECTIVE_SLOT_STALE" | "ELECTIVE_SELECTION_LOCKED" |
    "ELECTIVE_YEAR_INVALID") {
    super(code); this.name = "CollegeElectiveSlotMutationError";
  }
}

async function currentCollege(context: RequestContext) {
  const acting=await resolveActingCollege(context, "academics.manage");
  await assertCollegeElectivesEnabled(context);
  return acting;
}

function academicYear(value: string | null) {
  try { return normalizeSlotYear(value); }
  catch { throw new CollegeElectiveSlotMutationError("ELECTIVE_YEAR_INVALID"); }
}

export async function listCollegeElectiveSlotOptions(context: RequestContext) {
  const member = await currentCollege(context);
  const db = getDb();
  const [programRows, periodRows] = await Promise.all([
    db.select({ id: programs.id, name: programs.name, durationTerms: programs.durationTerms })
      .from(programs)
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId),
      ))
      .where(eq(programs.status, "ACTIVE")),
    db.select({ id: academicPeriods.id, name: academicPeriods.name })
      .from(academicPeriods)
      .where(and(eq(academicPeriods.collegeId, member.collegeId),
        inArray(academicPeriods.status, ["PLANNED", "ACTIVE"]))),
  ]);
  return { programs: programRows, periods: periodRows };
}

export async function createCollegeElectiveSlot(
  context: RequestContext,
  raw: unknown,
  transaction: TxRunner = (fn) => getDb().transaction(fn),
) {
  const input = createCollegeElectiveSlotSchema.parse(raw);
  const member = await currentCollege(context);
  return transaction(async tx => {
    const [program] = await tx.select({
      id: programs.id, durationTerms: programs.durationTerms,
    }).from(programs).innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    )).where(and(eq(programs.id, input.programId), eq(programs.status, "ACTIVE")))
      .for("share", { of: programs }).limit(1);
    if (!program) throw new CollegeElectiveSlotMutationError("ELECTIVE_PROGRAM_NOT_FOUND");
    if (input.semesterNumber > program.durationTerms)
      throw new CollegeElectiveSlotMutationError("ELECTIVE_SEMESTER_INVALID");
    if (input.academicPeriodId) {
      const [period] = await tx.select({ id: academicPeriods.id })
        .from(academicPeriods)
        .where(and(eq(academicPeriods.id, input.academicPeriodId),
          eq(academicPeriods.collegeId, member.collegeId),
          inArray(academicPeriods.status, ["ACTIVE", "PLANNED"])))
        .for("share").limit(1);
      if (!period) throw new CollegeElectiveSlotMutationError("ELECTIVE_PERIOD_INVALID");
    }
    await assertPersistedGroupActor(tx, context, { collegeId: member.collegeId, mode: "MANUAL" });
    const [slot] = await tx.insert(electiveSlots).values({
      collegeId: member.collegeId,
      programId: input.programId,
      academicPeriodId: input.academicPeriodId,
      semesterNumber: input.semesterNumber,
      academicYear: academicYear(input.academicYear),
      name: input.name,
      description: input.description,
      credits: input.credits, minPick: input.minPick, maxPick: input.maxPick,
    }).returning();
    if (!slot) throw new Error("ELECTIVE_SLOT_INSERT_FAILED");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_ELECTIVE_SLOT_CREATED,
      organizationId: member.organizationId, collegeId: member.collegeId,
      subjectType: "elective_slot", subjectId: slot.id,
      summary: "Elective slot created",
      metadata: { programId: slot.programId, semesterNumber: slot.semesterNumber },
    });
    return slot;
  });
}

export async function updateCollegeElectiveSlot(
  context: RequestContext,
  slotIdInput: string,
  raw: unknown,
  transaction: TxRunner = (fn) => getDb().transaction(fn),
) {
  const slotId = z.string().uuid().parse(slotIdInput);
  const input = editCollegeElectiveSlotSchema.parse(raw);
  const member = await currentCollege(context);
  return transaction(async tx => {
    const [slot] = await tx.select().from(electiveSlots)
      .where(and(eq(electiveSlots.id, slotId),
        eq(electiveSlots.collegeId, member.collegeId),
        isNull(electiveSlots.deletedAt)))
      .for("update").limit(1);
    if (!slot) throw new CollegeElectiveSlotMutationError("ELECTIVE_SLOT_NOT_FOUND");
    if (slot.status !== "ACTIVE" || slot.version !== input.expectedVersion)
      throw new CollegeElectiveSlotMutationError("ELECTIVE_SLOT_STALE");
    await assertPersistedGroupActor(tx, context, { collegeId: member.collegeId, mode: "MANUAL" });
    if (slotSelectionChanged(slot, input)) {
      const [roster] = await tx.select({ total: count() })
        .from(lmsGroupMembers)
        .innerJoin(electiveOfferings, eq(electiveOfferings.groupId, lmsGroupMembers.groupId))
        .where(and(eq(electiveOfferings.slotId, slot.id),
          eq(electiveOfferings.status, "ACTIVE"),
          isNull(electiveOfferings.deletedAt),
          inArray(lmsGroupMembers.state, ["ACTIVE", "WAITLISTED", "REQUESTED"])));
      if ((roster?.total ?? 0) > 0)
        throw new CollegeElectiveSlotMutationError("ELECTIVE_SELECTION_LOCKED");
    }
    const [saved] = await tx.update(electiveSlots).set({
      name: input.name, description: input.description,
      credits: input.credits, minPick: input.minPick, maxPick: input.maxPick,
      version: sql`${electiveSlots.version} + 1`, updatedAt: new Date(),
    }).where(and(eq(electiveSlots.id, slot.id),
      eq(electiveSlots.version, input.expectedVersion),
      eq(electiveSlots.collegeId, member.collegeId))).returning();
    if (!saved) throw new CollegeElectiveSlotMutationError("ELECTIVE_SLOT_STALE");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_ELECTIVE_SLOT_UPDATED,
      organizationId: member.organizationId, collegeId: member.collegeId,
      subjectType: "elective_slot", subjectId: slot.id,
      summary: "Elective slot updated",
      metadata: { previousVersion: slot.version, version: saved.version },
    });
    return saved;
  });
}
