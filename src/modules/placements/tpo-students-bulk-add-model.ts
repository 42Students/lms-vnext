import { bulkDriveAddSchema, type BulkDriveResult } from "./bulk-drive-model";

export type TpoStudentsBulkSelection = {
  membershipId: string;
  displayName: string;
};

export function buildTpoStudentsBulkPayload(
  roleOptionId: string,
  selected: readonly TpoStudentsBulkSelection[],
) {
  return bulkDriveAddSchema.parse({
    roleOptionId,
    membershipIds: selected.map((learner) => learner.membershipId),
    confirmed: true,
  });
}

export function formatTpoStudentsBulkOutcome(
  result: BulkDriveResult,
): string {
  if (result.status === "added") return "Added to drive";
  if (result.status === "already-added") return "Already on this drive";
  return result.reason?.trim() || "Not eligible for this drive";
}
