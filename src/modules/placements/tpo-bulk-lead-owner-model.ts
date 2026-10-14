import { z } from "zod";

const uuid = z.string().uuid();

export const confirmedTpoBulkLeadOwnerSchema = z.object({
  confirmed: z.literal(true),
  ownerMembershipId: uuid,
  selections: z.array(z.object({
    id: uuid,
    expectedOwnerMembershipId: uuid.nullable(),
  }).strict()).min(1).max(100).refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    "Duplicate lead IDs are not allowed",
  ),
}).strict();

export type TpoBulkOwnerSelection =
  z.output<typeof confirmedTpoBulkLeadOwnerSchema>["selections"][number];

export type TpoBulkOwnerLead = {
  ownerMembershipId: string | null;
  recruiterUserId: string | null;
  unsubscribedAt: Date | null;
};

export type TpoBulkOwnerResult = {
  leadId: string;
  status: "updated" | "unchanged" | "ineligible";
  reason: string | null;
};

/** Pure optimistic decision; the caller must lock the lead before applying it. */
export function decideTpoLeadOwnerChange(
  current: TpoBulkOwnerLead | null,
  selection: TpoBulkOwnerSelection,
  newOwnerMembershipId: string,
): Omit<TpoBulkOwnerResult, "leadId"> {
  if (!current) return {
    status: "ineligible",
    reason: "Lead is unavailable in this college",
  };
  if (current.recruiterUserId || current.unsubscribedAt) return {
    status: "ineligible",
    reason: "Joined or unsubscribed lead is protected",
  };
  if (current.ownerMembershipId !== selection.expectedOwnerMembershipId) return {
    status: "ineligible",
    reason: "Owner changed; review the lead again",
  };
  if (current.ownerMembershipId === newOwnerMembershipId) {
    return { status: "unchanged", reason: null };
  }
  return { status: "updated", reason: null };
}

/** Persisted actor audit, not a system activity: immutable DB09 NOTE. */
export function tpoLeadOwnerAuditNote(
  previous: string | null,
  next: string,
): string {
  return "Lead owner reassigned from " + (previous ?? "unassigned") + " to " + next;
}

export function summarizeTpoBulkLeadOwners(rows: readonly TpoBulkOwnerResult[]) {
  return {
    total: rows.length,
    updated: rows.filter((row) => row.status === "updated").length,
    unchanged: rows.filter((row) => row.status === "unchanged").length,
    ineligible: rows.filter((row) => row.status === "ineligible").length,
  };
}
