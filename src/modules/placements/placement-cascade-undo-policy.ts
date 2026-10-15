import { PlacementsServiceError } from "./errors";

/** P-S1-06 strict, all-or-nothing compensation preconditions. */
export function assertUndoablePlacementCascadeSnapshot(input: {
  acceptedStatus: string | null;
  acceptedHistoryReason: string | null;
  cascadeId: string;
  joiningStatus: string | null;
  joiningHasHistory: boolean;
  siblingOfferStatuses: readonly string[];
  siblingApplicationStatuses: readonly string[];
}): void {
  if (input.acceptedStatus !== "ACCEPTED" ||
      input.acceptedHistoryReason !== `cascade:${input.cascadeId}` ||
      (input.joiningStatus !== null && input.joiningStatus !== "PENDING") ||
      input.joiningHasHistory ||
      input.siblingOfferStatuses.some((status) => status !== "DECLINED") ||
      input.siblingApplicationStatuses.some((status) => status !== "WITHDRAWN")) {
    throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
  }
}
