import { z } from "zod";
import { placementReportCsv } from "./report-model";

export const tpoCloseoutJobSchema = z.string().uuid();
export type TpoCloseoutApplication = {
  id: string; membershipId: string; status: string; screeningStatus: string | null;
};
export type TpoCloseoutOffer = {
  id: string; applicationId: string; membershipId: string;
  status: string; joiningStatus: string | null;
};

/**
 * Counts explicitly persisted facts, never guesses selected learners from
 * intermediate PASS outcomes or accepted offers. All values are for ONE job.
 */
export function projectTpoDriveCloseout(
  applications: readonly TpoCloseoutApplication[],
  offers: readonly TpoCloseoutOffer[],
) {
  const active = applications.filter(item => item.status === "SUBMITTED");
  const eligibleIds = new Set(applications.map(item => item.id));
  const scopedOffers = offers.filter(item => eligibleIds.has(item.applicationId));
  const distinct = (xs: readonly string[]) => new Set(xs).size;
  return {
    applied: distinct(applications.map(item => item.membershipId)),
    currentlySubmitted: distinct(active.map(item => item.membershipId)),
    shortlisted: distinct(active.filter(item => item.screeningStatus === "SHORTLISTED")
      .map(item => item.membershipId)),
    selected: null as number | null,
    offered: distinct(scopedOffers.map(item => item.membershipId)),
    offerVersions: scopedOffers.length,
    accepted: distinct(scopedOffers.filter(item => item.status === "ACCEPTED")
      .map(item => item.membershipId)),
    joined: distinct(scopedOffers.filter(item =>
      item.status === "ACCEPTED" && item.joiningStatus === "JOINED",
    ).map(item => item.membershipId)),
  };
}

export function tpoDriveCloseoutCsv(
  jobTitle: string, counts: ReturnType<typeof projectTpoDriveCloseout>,
): string {
  return placementReportCsv(["Drive", "Metric", "Value", "Evidence"], [
    [jobTitle, "Applications ever recorded (distinct learners)", counts.applied, "Persisted job applications"],
    [jobTitle, "Currently submitted", counts.currentlySubmitted, "Status SUBMITTED"],
    [jobTitle, "Currently shortlisted", counts.shortlisted, "SUBMITTED + screening SHORTLISTED"],
    [jobTitle, "Selected", null, "Unavailable: no canonical persisted final selection signal"],
    [jobTitle, "Offered learners", counts.offered, "Distinct members with persisted offer versions"],
    [jobTitle, "Offer versions", counts.offerVersions, "Persisted offer records"],
    [jobTitle, "Currently accepted", counts.accepted, "Current offer status ACCEPTED"],
    [jobTitle, "Confirmed joined", counts.joined, "ACCEPTED offer with JOINED outcome"],
  ]);
}
