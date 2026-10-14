import { describe, expect, it } from "vitest";
import {
  learnerApplicationHistoryTimeline,
  learnerCompanyPreview,
  safeLearnerCompanyWebsite,
} from "@/modules/placements/learner-application-detail-model";

describe("Learner application history read model", () => {
  it("sorts actual persisted events chronologically without inventing transitions", () => {
    const result = learnerApplicationHistoryTimeline([
      {
        id: "b",
        fromStatus: "SUBMITTED",
        toStatus: "WITHDRAWN",
        occurredAt: new Date("2026-10-10T10:00:00.000Z"),
      },
      {
        id: "a",
        fromStatus: null,
        toStatus: "SUBMITTED",
        occurredAt: new Date("2026-10-08T10:00:00.000Z"),
      },
    ]);
    expect(result.map((row) => row.toStatus)).toEqual([
      "SUBMITTED",
      "WITHDRAWN",
    ]);
    expect(result.map((row) => row.label)).toEqual([
      "Application submitted",
      "Application withdrawn",
    ]);
  });

  it("shows an empty history honestly", () => {
    expect(learnerApplicationHistoryTimeline([])).toEqual([]);
  });

  it("projects only actual status fields and does not mutate input", () => {
    const input = Object.freeze([{
      id: "first",
      fromStatus: null,
      toStatus: "SUBMITTED",
      occurredAt: new Date("2026-10-08T10:00:00.000Z"),
    }]);
    const rows = learnerApplicationHistoryTimeline(input);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]!)).toEqual([
      "id",
      "fromStatus",
      "toStatus",
      "occurredAt",
      "label",
    ]);
    expect(input[0]?.toStatus).toBe("SUBMITTED");
  });
});

describe("Learner company preview", () => {
  it("keeps supported employer fields and does not invent a biography or logo", () => {
    expect(learnerCompanyPreview({
      companyName: "Example Employer",
      companyStatus: "ACTIVE",
      websiteUrl: "https://jobs.example.com",
      roleTitle: "Engineer",
      driveTitle: "Campus Hiring",
    })).toEqual({
      companyName: "Example Employer",
      companyStatus: "ACTIVE",
      websiteUrl: "https://jobs.example.com/",
      roleTitle: "Engineer",
      driveTitle: "Campus Hiring",
      hasCompanyDescription: false,
    });
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "http://example.com",
    "https://user:password@example.com",
    "https://example.com/jobs?token=secret",
    "https://example.com/jobs#private",
    "/private/company",
    "https://localhost/",
    "https://exa mple.com",
  ])("rejects unsafe websites: %s", (value) => {
    expect(safeLearnerCompanyWebsite(value)).toBeNull();
  });

  it("shows an absent website honestly", () => {
    expect(safeLearnerCompanyWebsite(null)).toBeNull();
    expect(safeLearnerCompanyWebsite("")).toBeNull();
  });
});
