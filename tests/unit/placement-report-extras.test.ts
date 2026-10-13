import { describe, expect, it } from "vitest";
import {
  normalizePlacementFailureReason,
  summarizePlacementFailureReasons,
  summarizePlacementLeads,
  type PlacementFailureFact,
  type PlacementLeadReportFact,
} from "@/modules/placements/report-extra-model";
import {
  placementReportCsv,
} from "@/modules/placements/report-model";

const failures: PlacementFailureFact[] = [
  {
    id: "screen-1",
    jobId: "drive-a",
    jobTitle: "Software Engineer",
    companyName: "Company A",
    kind: "SCREENING_REJECTED",
    reason: "  Missing   skills ",
  },
  {
    id: "screen-2",
    jobId: "drive-a",
    jobTitle: "Software Engineer",
    companyName: "Company A",
    kind: "SCREENING_REJECTED",
    reason: "Missing skills",
  },
  {
    id: "round-1",
    jobId: "drive-b",
    jobTitle: "Graduate Engineer",
    companyName: "Company B",
    kind: "ROUND_FAILED",
    reason: "TECHNICAL",
  },
  {
    id: "withdraw-1",
    jobId: "drive-a",
    jobTitle: "Software Engineer",
    companyName: "Company A",
    kind: "APPLICATION_WITHDRAWN",
    reason: null,
  },
  {
    id: "offer-decline-1",
    jobId: "drive-b",
    jobTitle: "Graduate Engineer",
    companyName: "Company B",
    kind: "OFFER_DECLINED",
    reason: "Location",
  },
  {
    id: "offer-withdrawal-1",
    jobId: "drive-b",
    jobTitle: "Graduate Engineer",
    companyName: "Company B",
    kind: "OFFER_WITHDRAWN",
    reason: "Location",
  },
];

const leads: PlacementLeadReportFact[] = [
  {
    id: "lead-1",
    manualStage: "NEW",
    source: "ALUMNI",
    invited: true,
    inviteClicked: true,
    recruiterAccountLinked: true,
    companyRelationshipLinked: true,
  },
  {
    id: "lead-2",
    manualStage: "CONTACTED",
    source: "ALUMNI",
    invited: true,
    inviteClicked: false,
    recruiterAccountLinked: false,
    companyRelationshipLinked: false,
  },
  {
    id: "lead-3",
    manualStage: "NOT_NOW",
    source: "REFERRAL",
    invited: false,
    inviteClicked: false,
    recruiterAccountLinked: false,
    companyRelationshipLinked: false,
  },
  {
    id: "lead-4",
    manualStage: "NEW",
    source: null,
    invited: false,
    inviteClicked: false,
    recruiterAccountLinked: false,
    companyRelationshipLinked: false,
  },
];

describe("TPO failure-reason derivation", () => {
  it("normalizes whitespace and reports missing reasons", () => {
    expect(
      normalizePlacementFailureReason(
        "  Missing \n skills  ",
      ),
    ).toBe("Missing skills");

    expect(
      normalizePlacementFailureReason(null),
    ).toBe("Reason not recorded");

    expect(
      normalizePlacementFailureReason(" "),
    ).toBe("Reason not recorded");
  });

  it("counts recorded outcomes, not distinct students", () => {
    const result =
      summarizePlacementFailureReasons(failures);

    expect(result.total).toBe(6);

    expect(
      result.byKind.find(
        (row) =>
          row.kind === "SCREENING_REJECTED",
      )?.count,
    ).toBe(2);

    expect(
      result.byReason.find(
        (row) =>
          row.kind === "SCREENING_REJECTED" &&
          row.reason === "Missing skills",
      )?.count,
    ).toBe(2);
  });

  it("keeps outcome types and drives distinct", () => {
    const result =
      summarizePlacementFailureReasons(failures);

    expect(
      result.byReason.filter(
        (row) => row.reason === "Location",
      ),
    ).toHaveLength(2);

    expect(
      result.byDrive.find(
        (row) =>
          row.jobId === "drive-a" &&
          row.kind === "SCREENING_REJECTED" &&
          row.reason === "Missing skills",
      )?.count,
    ).toBe(2);

    expect(
      result.byDrive.find(
        (row) =>
          row.jobId === "drive-b" &&
          row.kind === "ROUND_FAILED",
      )?.count,
    ).toBe(1);
  });

  it("does not multiply duplicate persisted records", () => {
    const result =
      summarizePlacementFailureReasons([
        ...failures,
        failures[0]!,
        failures[0]!,
      ]);

    expect(result.total).toBe(6);
  });

  it("returns truthful empty totals", () => {
    expect(
      summarizePlacementFailureReasons([]),
    ).toEqual({
      total: 0,
      byKind: [],
      byReason: [],
      byDrive: [],
    });
  });
});

describe("TPO lead-report derivation", () => {
  it("groups lead counts by stage and source", () => {
    const result =
      summarizePlacementLeads(leads);

    expect(result.totals).toMatchObject({
      leads: 4,
      invited: 2,
      inviteClicked: 1,
      recruiterAccountsLinked: 1,
      companyRelationshipsLinked: 1,
      recruiterLinkRatePercent: 25,
    });

    expect(
      result.byStage.find(
        (row) => row.label === "NEW",
      ),
    ).toMatchObject({
      leads: 2,
      invited: 1,
      recruiterAccountsLinked: 1,
      recruiterLinkRatePercent: 50,
    });

    expect(
      result.bySource.find(
        (row) => row.label === "ALUMNI",
      ),
    ).toMatchObject({
      leads: 2,
      invited: 2,
      recruiterAccountsLinked: 1,
      recruiterLinkRatePercent: 50,
    });
  });

  it("keeps missing lead sources explicit", () => {
    const result =
      summarizePlacementLeads(leads);

    expect(
      result.bySource.find(
        (row) => row.label === "Not recorded",
      )?.leads,
    ).toBe(1);
  });

  it("does not treat an invite as account conversion", () => {
    const result =
      summarizePlacementLeads(leads);

    expect(result.totals.invited).toBe(2);
    expect(
      result.totals.recruiterAccountsLinked,
    ).toBe(1);
  });

  it("deduplicates leads by persisted identifier", () => {
    const result =
      summarizePlacementLeads([
        ...leads,
        leads[0]!,
      ]);

    expect(result.totals.leads).toBe(4);
    expect(result.totals.invited).toBe(2);
  });

  it("does not invent a conversion percentage with no leads", () => {
    expect(
      summarizePlacementLeads([]),
    ).toEqual({
      totals: {
        leads: 0,
        invited: 0,
        inviteClicked: 0,
        recruiterAccountsLinked: 0,
        companyRelationshipsLinked: 0,
        recruiterLinkRatePercent: null,
      },
      byStage: [],
      bySource: [],
    });
  });

  it("keeps new report CSV cells formula-safe", () => {
    const csv = placementReportCsv(
      ["Reason", "Count"],
      [["=SUSPICIOUS()", 1]],
    );

    expect(csv).toContain(
      "\"'=SUSPICIOUS()\"",
    );
    expect(csv).toContain('"1"');
  });
});
