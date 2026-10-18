import { describe, expect, it } from "vitest";
import {
  countsAsPlacedByCollegeRule,
  summarizePlacementReports,
  summarizePlacementReportDetails,
  type PlacementReportFacts,
  type PlacementReportDetailedOffer,
} from "@/modules/placements/report-model";

const jobs = [{
  id: "job-a", title: "Engineer", companyId: "company-a",
  companyName: "Acme", employmentType: "FULL_TIME",
}];

const facts: PlacementReportFacts = {
  jobs,
  applications: [
    { id: "a1", jobId: "job-a", membershipId: "learner-a", status: "SUBMITTED", screeningStatus: null },
    { id: "a2", jobId: "job-a", membershipId: "learner-b", status: "SUBMITTED", screeningStatus: null },
  ],
  registrations: [{ membershipId: "learner-a" }, { membershipId: "learner-b" }],
  offers: [
    { id: "real", jobId: "job-a", membershipId: "learner-a", status: "ACCEPTED",
      kind: "OFFER", annualCtcInr: 1_000_000, joiningStatus: null },
    { id: "loi-same", jobId: "job-a", membershipId: "learner-a", status: "ACCEPTED",
      kind: "LOI", annualCtcInr: 9_000_000, joiningStatus: null },
    { id: "loi-only", jobId: "job-a", membershipId: "learner-b", status: "ACCEPTED",
      kind: "LOI", annualCtcInr: 8_000_000, joiningStatus: null },
  ],
  branches: [
    { membershipId: "learner-a", departmentId: "dept-a", departmentName: "Engineering" },
    { membershipId: "learner-b", departmentId: "dept-a", departmentName: "Engineering" },
  ],
};

const detailOffers: PlacementReportDetailedOffer[] = facts.offers.map(offer => ({
  ...offer,
  jobTitle: "Engineer",
  companyId: "company-a",
  companyName: "Acme",
  employmentType: "FULL_TIME",
  expiresAt: null,
}));

describe("chat-13 accepted-offer vs LOI compensation and placement accounting", () => {
  it("SA-REPORT-PACKAGE-08 does not let LOI placeholder CTC inflate accepted full-time offer summary or branch/company totals", () => {
    const result = summarizePlacementReports(facts);
    expect(countsAsPlacedByCollegeRule({
      employmentType: "FULL_TIME", offerStatus: "ACCEPTED",
      offerKind: "LOI", countsAsPlacedAt: "OFFER_ACCEPTED",
    })).toBe(false);
    expect(result.metrics.offers).toBe(3);
    expect(result.metrics.acceptedOffers).toBe(3);
    expect(result.metrics.studentsPlaced).toBe(1);
    expect(result.metrics.studentsWithPackage).toBe(1);
    expect(result.metrics.averagePackageInr).toBe(1_000_000);
    expect(result.metrics.medianPackageInr).toBe(1_000_000);
    expect(result.metrics.highestPackageInr).toBe(1_000_000);
    expect(result.byCompany[0]?.averagePackageInr).toBe(1_000_000);
    expect(result.byCompany[0]?.highestPackageInr).toBe(1_000_000);
    expect(result.byBranch[0]?.averagePackageInr).toBe(1_000_000);
  });

  it("SA-REPORT-PACKAGE-09 keeps detailed CTC bands, unplaced pool and summary consistent when LOIs exist", () => {
    const detail = summarizePlacementReportDetails({
      registeredLearners: [
        { membershipId: "learner-a", displayName: "A", departmentId: "dept-a", departmentName: "Engineering" },
        { membershipId: "learner-b", displayName: "B", departmentId: "dept-a", departmentName: "Engineering" },
      ],
      offers: detailOffers,
      asOf: "2099-08-01T00:00:00.000Z",
    });
    expect(detail.ctc.acceptedFullTimeOffers).toBe(1);
    expect(detail.ctc.knownCtcOffers).toBe(1);
    expect(detail.ctc.unknownCtcOffers).toBe(0);
    expect(detail.ctc.averageInr).toBe(1_000_000);
    expect(detail.ctc.highestInr).toBe(1_000_000);
    expect(detail.ctc.bands.reduce((sum, band) => sum + band.offers, 0)).toBe(1);
    expect(detail.unplaced.map(learner => learner.membershipId)).toEqual(["learner-b"]);
    expect(detail.offers.totals.accepted).toBe(3);
  });
});
