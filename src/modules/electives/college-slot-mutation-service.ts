import "server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  academicPeriods, departments, electiveOfferings,
  electiveSlots, lmsGroupMembers, lmsGroupMemberEvents, programs,
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
    "ELECTIVE_PICK_RANGE_INVALID" | "ELECTIVE_YEAR_INVALID" | "ELECTIVE_SLOT_ARCHIVED") {
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

/** Legacy /api/v1/electives/admin/slots POST -> create (scoped college),
 * PUT /slots/{id} -> updateCollegeElectiveSlot(UUID, expectedVersion).
 * Legacy /archive maps to the status transition endpoint, not hard delete.
 * The group actor and tenant resolution are still checked transactionally.
 */
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
      metadata: { programId: slot.programId, semesterNumber: slot.semesterNumber,
        legacyAction: "CREATE_SLOT", idKind: "UUID", groupActorVerified: true },
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
    if (slot.status !== "ACTIVE")
      throw new CollegeElectiveSlotMutationError("ELECTIVE_SLOT_ARCHIVED");
    if (slot.version !== input.expectedVersion)
      throw new CollegeElectiveSlotMutationError("ELECTIVE_SLOT_STALE");
    // Existing legacy rows can retain historic pick ranges above the new
    // browser cap, but no mutation may introduce or increase an over-cap limit.
    // Check under the slot FOR UPDATE lock, never against client-sent originals.
    if ((input.minPick > 10 && input.minPick !== slot.minPick) ||
        (input.maxPick > 10 && input.maxPick !== slot.maxPick))
      throw new CollegeElectiveSlotMutationError("ELECTIVE_PICK_RANGE_INVALID");
    await assertPersistedGroupActor(tx, context, { collegeId: member.collegeId, mode: "MANUAL" });
    const nextProgramId = input.programId ?? slot.programId;
    const nextSemesterNumber = input.semesterNumber ?? slot.semesterNumber;
    const nextPeriodId = input.academicPeriodId === undefined
      ? slot.academicPeriodId : input.academicPeriodId;
    const nextAcademicYear = input.academicYear === undefined
      ? slot.academicYear : academicYear(input.academicYear);
    const identityChanged =
      nextProgramId !== slot.programId ||
      nextSemesterNumber !== slot.semesterNumber ||
      nextPeriodId !== slot.academicPeriodId ||
      nextAcademicYear !== slot.academicYear;
    if (nextProgramId !== slot.programId || nextSemesterNumber !== slot.semesterNumber) {
      const [program] = await tx.select({ durationTerms: programs.durationTerms })
        .from(programs)
        .innerJoin(departments, and(
          eq(departments.id, programs.departmentId),
          eq(departments.collegeId, member.collegeId),
        ))
        .where(and(eq(programs.id, nextProgramId), eq(programs.status, "ACTIVE")))
        .for("share", { of: programs }).limit(1);
      if (!program) throw new CollegeElectiveSlotMutationError("ELECTIVE_PROGRAM_NOT_FOUND");
      if (nextSemesterNumber > program.durationTerms)
        throw new CollegeElectiveSlotMutationError("ELECTIVE_SEMESTER_INVALID");
    }
    if (input.academicPeriodId !== undefined && nextPeriodId !== null) {
      const [period] = await tx.select({ id: academicPeriods.id })
        .from(academicPeriods)
        .where(and(eq(academicPeriods.id, nextPeriodId),
          eq(academicPeriods.collegeId, member.collegeId),
          inArray(academicPeriods.status, ["PLANNED", "ACTIVE"])))
        .for("share").limit(1);
      if (!period) throw new CollegeElectiveSlotMutationError("ELECTIVE_PERIOD_INVALID");
    }
    if (identityChanged || slotSelectionChanged(slot, input)) {
      // Membership events are immutable evidence: a learner who removed their
      // last choice must still lock academic identity, credits and pick rules.
      // Check ALL offering histories, including archived/deleted offerings.
      const [[roster], [history]] = await Promise.all([
        tx.select({ id: lmsGroupMembers.id })
          .from(lmsGroupMembers)
          .innerJoin(electiveOfferings, eq(electiveOfferings.groupId, lmsGroupMembers.groupId))
          .where(eq(electiveOfferings.slotId, slot.id)).limit(1),
        tx.select({ id: lmsGroupMemberEvents.id })
          .from(lmsGroupMemberEvents)
          .innerJoin(electiveOfferings, eq(electiveOfferings.groupId, lmsGroupMemberEvents.groupId))
          .where(eq(electiveOfferings.slotId, slot.id)).limit(1),
      ]);
      if (roster || history)
        throw new CollegeElectiveSlotMutationError("ELECTIVE_SELECTION_LOCKED");
    }
    const [saved] = await tx.update(electiveSlots).set({
      programId: nextProgramId, semesterNumber: nextSemesterNumber,
      academicPeriodId: nextPeriodId, academicYear: nextAcademicYear,
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
      metadata: { previousVersion: slot.version, version: saved.version,
        previousProgramId: slot.programId, programId: saved.programId,
        previousSemester: slot.semesterNumber, semester: saved.semesterNumber,
        previousAcademicYear: slot.academicYear, academicYear: saved.academicYear,
        legacyAction: "UPDATE_SLOT", idKind: "UUID", groupActorVerified: true,
      },
    });
    return saved;
  });
}
