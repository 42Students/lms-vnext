/**
 * W04 -> W05 read-only, college-scoped placement execution facts.
 * CRM stages are projections of durable Drives and Offers, never editable
 * status flags. The consumer chooses the displayed label from this evidence.
 */
export type DriveFactRow = {
  jobId: string;
  jobStatus: string;
  archivedAt: Date | null;
  offerStatus: string | null;
  joiningStatus: string | null;
};

export function deriveCompanyDriveFacts(rows: readonly DriveFactRow[]) {
  const planned = new Set<string>();
  const accepted = new Set<string>();
  const joined = new Set<string>();

  for (const row of rows) {
    if (row.archivedAt || !["PUBLISHED", "CLOSED"].includes(row.jobStatus)) {
      // Draft or archived drives do not count as current planned drives.
      continue;
    }
    planned.add(row.jobId);
    if (row.offerStatus === "ACCEPTED") accepted.add(row.jobId);
    if (row.offerStatus === "ACCEPTED" && row.joiningStatus === "JOINED") {
      joined.add(row.jobId);
    }
  }
  return {
    plannedDriveCount: planned.size,
    acceptedOfferDriveCount: accepted.size,
    confirmedJoinedDriveCount: joined.size,
    hasDrivePlanned: planned.size > 0,
    hasAcceptedOffer: accepted.size > 0,
    hasConfirmedJoin: joined.size > 0,
  };
}
