import { z } from "zod";

export const tpoBulkStageSelectionsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    expectedStage: z.enum(["NEW", "CONTACTED", "NOT_NOW"]),
  }).strict(),
).min(1).max(100).refine(
  (items) => new Set(items.map((item) => item.id)).size === items.length,
  "Duplicate lead IDs are not allowed",
);

export const confirmedTpoBulkLeadStageSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("NEW"),confirmed:z.literal(true),selections:tpoBulkStageSelectionsSchema,
  }).strict(),
  z.object({
    action: z.literal("CONTACTED"),
    confirmed: z.literal(true),
    selections: tpoBulkStageSelectionsSchema,
  }).strict(),
  z.object({
    action: z.literal("NOT_NOW"),
    confirmed: z.literal(true),
    selections: tpoBulkStageSelectionsSchema,
    reason: z.string().trim().min(1).max(255),
    revisitDate: z.iso.date().nullable(),
  }).strict(),
]);

export type TpoBulkLeadSelection =
  z.output<typeof tpoBulkStageSelectionsSchema>[number];
export type ConfirmedTpoBulkLeadStage =
  z.output<typeof confirmedTpoBulkLeadStageSchema>;

export type TpoBulkLeadStageResult = {
  leadId: string;
  status: "updated" | "unchanged" | "ineligible";
  reason: string | null;
};

export type TpoBulkLeadState = {
  manualStage: string;
  recruiterUserId: string | null;
  unsubscribedAt: Date | null;
  notNowReason: string | null;
  notNowUntil: string | null;
};

/** A manual contact state may be changed even if access has joined or email is unsubscribed. */
export function decideTpoBulkLeadStage(
  current: TpoBulkLeadState | null,
  selection: TpoBulkLeadSelection,
  decision: ConfirmedTpoBulkLeadStage,
): Omit<TpoBulkLeadStageResult, "leadId"> {
  if (!current) return { status: "ineligible", reason: "Lead is unavailable in this college" };
  if (current.manualStage !== selection.expectedStage) {
    return { status: "ineligible", reason: "Stage changed; review the lead again" };
  }
  if (decision.action === "NEW") {
    return current.manualStage === "NEW"?{status:"unchanged",reason:null}:
     {status:"updated",reason:null};
  }
  if (decision.action === "CONTACTED") {
    return current.manualStage === "CONTACTED"
      ? { status: "unchanged", reason: null }
      : { status: "updated", reason: null };
  }
  if (current.manualStage === "NOT_NOW" &&
    current.notNowReason === decision.reason &&
    current.notNowUntil === decision.revisitDate) {
    return { status: "unchanged", reason: null };
  }
  return { status: "updated", reason: null };
}

export function summarizeTpoBulkLeadStages(
  results: readonly TpoBulkLeadStageResult[],
) {
  return {
    total: results.length,
    updated: results.filter((item) => item.status === "updated").length,
    unchanged: results.filter((item) => item.status === "unchanged").length,
    ineligible: results.filter((item) => item.status === "ineligible").length,
  };
}
