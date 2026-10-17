import { z } from "zod";

export const bulkDriveAddSchema = z.object({
  roleOptionId: z.string().uuid(),
  membershipIds: z.array(z.string().uuid()).min(1).max(200)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate learners are not allowed"),
  confirmed: z.literal(true),
  includeIneligible:z.object({reason:z.string().trim().min(3).max(500)}).strict().optional(),
}).strict();

export const bulkDrivePreflightSchema=z.strictObject({
 roleOptionId:z.string().uuid(),
 membershipIds:z.array(z.string().uuid()).min(1).max(200)
  .refine(ids=>new Set(ids).size===ids.length,"Duplicate learners are not allowed"),
});

export const bulkDriveCandidatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  search: z.string().trim().max(80).default(""),
}).strict();

export type BulkDriveResult = {
  membershipId: string;
  status: "added" | "already-added" | "ineligible";
  reason?: string;
};

export function bulkDriveOutcome(
  membershipId: string,
  state: { existingStatus?: string | null; eligible: boolean; reason?: string },
): BulkDriveResult {
  if (state.existingStatus === "SUBMITTED") return { membershipId, status: "already-added" };
  if (state.existingStatus) return {
    membershipId, status: "ineligible", reason: "Existing application is not active",
  };
  if (!state.eligible) return {
    membershipId, status: "ineligible", reason: state.reason ?? "Not eligible for this drive",
  };
  return { membershipId, status: "added" };
}

export function bulkDriveCounts(results: readonly BulkDriveResult[]) {
  return {
    added: results.filter((item) => item.status === "added").length,
    alreadyAdded: results.filter((item) => item.status === "already-added").length,
    ineligible: results.filter((item) => item.status === "ineligible").length,
  };
}
