import { z } from "zod";
import {
  placementReportCsv,
  type PlacementReportCompanyRow,
  type PlacementReportMetrics,
  type PlacementReportDetails,
} from "./report-model";

export const tpoIntelligenceFiltersSchema = z.object({
  seasonId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
}).strict();

export type CompanyFunnelRow = {
  companyId: string;
  companyName: string;
  drives: number;
  applicants: number;
  submittedApplications: number;
  releasedOfferVersions: number;
  acceptedOfferVersions: number;
  uniqueAcceptedLearners: number;
  applicantToAcceptedPercent: number | null;
};

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : Math.round(numerator * 10000 / denominator) / 100;
}

/** Company funnel is observed persisted records; it is not a conversion cohort. */
export function buildTpoCompanyFunnel(companies: readonly PlacementReportCompanyRow[]): CompanyFunnelRow[] {
  return companies.map((row) => ({
    companyId: row.companyId,
    companyName: row.companyName,
    drives: row.drives,
    applicants: row.applicants,
    submittedApplications: row.applications,
    releasedOfferVersions: row.offers,
    acceptedOfferVersions: row.acceptedOffers,
    uniqueAcceptedLearners: row.placed,
    applicantToAcceptedPercent: ratio(row.placed, row.applicants),
  }));
}

export function buildTpoCompensationIntelligence(
  ctc: PlacementReportDetails["ctc"],
  metrics: PlacementReportMetrics,
) {
  return {
    acceptedFullTimeOfferVersions: ctc.acceptedFullTimeOffers,
    knownPackageOfferVersions: ctc.knownCtcOffers,
    missingPackageOfferVersions: ctc.unknownCtcOffers,
    knownPackageCoveragePercent: ratio(ctc.knownCtcOffers, ctc.acceptedFullTimeOffers),
    offerAverageInr: ctc.averageInr,
    offerMedianInr: ctc.medianInr,
    offerHighestInr: ctc.highestInr,
    uniqueLearnerBestAverageInr: metrics.averagePackageInr,
    uniqueLearnerBestMedianInr: metrics.medianPackageInr,
    uniqueLearnerBestHighestInr: metrics.highestPackageInr,
    bands: ctc.bands,
  };
}

export function tpoIntelligenceCsv(
  funnel: readonly CompanyFunnelRow[],
  compensation: ReturnType<typeof buildTpoCompensationIntelligence>,
): string {
  const headings = [
    "Section", "Name", "Drives", "Distinct applicants",
    "Submitted applications", "Released offer versions", "Accepted offer versions",
    "Distinct learners with accepted offers", "Accepted learners / applicants (%)",
    "Number", "Note",
  ];
  const funnelRows = funnel.map((row) => [
    "Company funnel", row.companyName, row.drives, row.applicants,
    row.submittedApplications, row.releasedOfferVersions, row.acceptedOfferVersions,
    row.uniqueAcceptedLearners, row.applicantToAcceptedPercent, null, null,
  ]);
  const compensationRows = [
    ["Accepted full-time offer versions", compensation.acceptedFullTimeOfferVersions],
    ["Offer versions with known CTC", compensation.knownPackageOfferVersions],
    ["Offer versions without CTC", compensation.missingPackageOfferVersions],
    ["Known CTC coverage (%)", compensation.knownPackageCoveragePercent],
    ["Offer average CTC (INR)", compensation.offerAverageInr],
    ["Offer median CTC (INR)", compensation.offerMedianInr],
    ["Offer highest CTC (INR)", compensation.offerHighestInr],
    ["Best offer per learner average CTC (INR)", compensation.uniqueLearnerBestAverageInr],
    ["Best offer per learner median CTC (INR)", compensation.uniqueLearnerBestMedianInr],
    ["Best offer per learner highest CTC (INR)", compensation.uniqueLearnerBestHighestInr],
  ].map(([name, value]) => [
    "Compensation", name, null, null, null, null, null, null, null, value,
    "Null means insufficient persisted evidence",
  ]);
  return placementReportCsv(headings, [...funnelRows, ...compensationRows]);
}
