import { z } from "zod";

export const tpoParticipationStatusSchema = z.enum([
  "ELIGIBLE", "INELIGIBLE", "NOT_DECIDED",
]);

export const tpoMembershipDecisionSchema = z.object({
  status: z.enum(["ELIGIBLE", "INELIGIBLE"]).nullable(),
  reason: z.string().nullable(),
  note: z.string().nullable(),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
}).strict();

export type TpoMembershipDecisionSnapshot =
  z.infer<typeof tpoMembershipDecisionSchema>;

export const tpoParticipationChangeSchema = z.object({
  status: tpoParticipationStatusSchema,
  reason: z.string().trim().max(200).optional(),
  note: z.string().trim().max(300).optional(),
  expected: tpoMembershipDecisionSchema,
}).strict().superRefine((value, ctx) => {
  if (value.status === "INELIGIBLE" && !value.reason?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["reason"],
      message: "An ineligible decision needs a reason",
    });
  }
});

export type TpoParticipationChange =
  z.infer<typeof tpoParticipationChangeSchema>;

export type TpoStoredDecision = {
  status: "ELIGIBLE" | "INELIGIBLE" | null;
  reason: string | null;
  note: string | null;
};

export function canonicalTpoParticipationChange(
  change: Pick<TpoParticipationChange, "status" | "reason" | "note">,
): TpoStoredDecision {
  if (change.status === "NOT_DECIDED") {
    // Clearing the membership override restores section/cohort inheritance.
    return { status: null, reason: null, note: null };
  }
  return {
    status: change.status,
    reason: change.status === "INELIGIBLE" ? change.reason?.trim() || null : null,
    note: change.note?.trim() || null,
  };
}

export function snapshotTpoMembershipDecision(
  value: (TpoStoredDecision & { updatedAt: Date }) | null | undefined,
): TpoMembershipDecisionSnapshot {
  return value ? {
    status: value.status,
    reason: value.reason,
    note: value.note,
    updatedAt: value.updatedAt.toISOString(),
  } : {
    status: null, reason: null, note: null, updatedAt: null,
  };
}

export function isTpoDecisionSnapshotCurrent(
  actual: TpoMembershipDecisionSnapshot,
  expected: TpoMembershipDecisionSnapshot,
): boolean {
  return actual.status === expected.status &&
    actual.reason === expected.reason &&
    actual.note === expected.note &&
    actual.updatedAt === expected.updatedAt;
}

export function hasTpoDecisionChanged(
  actual: TpoStoredDecision,
  next: TpoStoredDecision,
): boolean {
  return actual.status !== next.status ||
    actual.reason !== next.reason ||
    actual.note !== next.note;
}
