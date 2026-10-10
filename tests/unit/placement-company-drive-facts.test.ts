import { describe, expect, it } from "vitest";
import { deriveCompanyDriveFacts } from "@/modules/placements/company-drive-facts-policy";

describe("W04/W05 derived CRM facts from placement execution", () => {
  const base = { jobId: "job-1", jobStatus: "PUBLISHED", archivedAt: null };

  it("does not invent a Drive Planned stage from draft, closed? or archived-only candidates", () => {
    expect(deriveCompanyDriveFacts([
      { ...base, jobStatus: "DRAFT", offerStatus: null, joiningStatus: null },
      { ...base, archivedAt: new Date(), offerStatus: "ACCEPTED", joiningStatus: "JOINED" },
    ])).toEqual({
      plannedDriveCount: 0,
      acceptedOfferDriveCount: 0,
      confirmedJoinedDriveCount: 0,
      hasDrivePlanned: false,
      hasAcceptedOffer: false,
      hasConfirmedJoin: false,
    });
  });

  it("counts one planned Drive regardless of applicant and offer fanout", () => {
    const facts = deriveCompanyDriveFacts([
      { ...base, offerStatus: "ISSUED", joiningStatus: "PENDING" },
      { ...base, offerStatus: "DECLINED", joiningStatus: null },
      { ...base, offerStatus: "ACCEPTED", joiningStatus: "PENDING" },
    ]);
    expect(facts).toMatchObject({
      plannedDriveCount: 1,
      acceptedOfferDriveCount: 1,
      confirmedJoinedDriveCount: 0,
      hasDrivePlanned: true,
      hasAcceptedOffer: true,
      hasConfirmedJoin: false,
    });
  });

  it("treats confirmed joining separately from offer acceptance", () => {
    const facts = deriveCompanyDriveFacts([
      { ...base, jobId: "job-1", offerStatus: "ACCEPTED", joiningStatus: "JOINED" },
      { ...base, jobId: "job-2", jobStatus: "CLOSED",
        offerStatus: "ACCEPTED", joiningStatus: "DEFERRED" },
      { ...base, jobId: "job-3", jobStatus: "PUBLISHED",
        offerStatus: "WITHDRAWN", joiningStatus: "JOINED" },
    ]);
    expect(facts).toMatchObject({
      plannedDriveCount: 3,
      acceptedOfferDriveCount: 2,
      confirmedJoinedDriveCount: 1,
    });
  });

  it("filters empty and irrelevant evidence without fabricating recruiting stage", () => {
    expect(deriveCompanyDriveFacts([]).hasDrivePlanned).toBe(false);
    expect(deriveCompanyDriveFacts([
      { ...base, jobStatus: "ARCHIVED", offerStatus: "ACCEPTED", joiningStatus: "JOINED" },
    ]).hasConfirmedJoin).toBe(false);
  });
});
