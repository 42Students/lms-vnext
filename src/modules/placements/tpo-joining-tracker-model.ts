import { z } from "zod";

export const tpoJoiningTrackerQuerySchema = z.object({
  jobId: z.string().uuid(),
}).strict();

export type TpoJoiningSourceRow = {
  offer: {
    id: string;
    status: string;
    roleTitle: string;
    annualCtcInr: number | null;
    issuedAt: Date;
  };
  joining: {
    status: string;
    joiningDate: string | null;
    reason: string | null;
  } | null;
  candidate: { membershipId: string; displayName: string | null };
};

/** An unrecorded joining outcome is pending, not proof of joining. */
export function projectTpoJoiningTracker(rows: readonly TpoJoiningSourceRow[]) {
  const accepted = rows.filter((row) => row.offer.status === "ACCEPTED");
  const items = accepted.map((row) => ({
    offerId: row.offer.id,
    membershipId: row.candidate.membershipId,
    displayName: row.candidate.displayName?.trim() || "Unnamed learner",
    roleTitle: row.offer.roleTitle,
    annualCtcInr: row.offer.annualCtcInr,
    issuedAtIso: row.offer.issuedAt.toISOString(),
    joiningStatus: row.joining?.status ?? "PENDING",
    joiningDate: row.joining?.joiningDate ?? null,
    reason: row.joining?.reason ?? null,
    hasRecordedOutcome: (row.joining?.status ?? "PENDING") !== "PENDING",
  }));
  return {
    items,
    counts: {
      accepted: items.length,
      pending: items.filter((item) => item.joiningStatus === "PENDING").length,
      joined: items.filter((item) => item.joiningStatus === "JOINED").length,
      deferred: items.filter((item) => item.joiningStatus === "DEFERRED").length,
      didNotJoin: items.filter((item) => item.joiningStatus === "DID_NOT_JOIN").length,
    },
  };
}
