import { describe, expect, it } from "vitest";
import { deriveOwnRecruiterLeadStage, tpoCompanyKey } from "@/modules/placements/tpo-company-memory-service";

describe("W05 TPO Company Memory grouping", () => {
  it.each([
    ["Infosys", "infosys"],
    [" Infosys Ltd. ", "infosys"],
    ["Infosys Limited", "infosys"],
    ["INFOSYS PRIVATE LIMITED", "infosys"],
    ["Acme Pvt. Ltd.", "acme"],
    ["Acme Corporation", "acme"],
    ["Acme Co", "acme"],
    ["Foo &amp; Bar LLP", "foo & bar"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(tpoCompanyKey(input)).toBe(expected);
  });

  it("does not erase a meaningful one-word company name", () => {
    expect(tpoCompanyKey("Company")).toBe("company");
    expect(tpoCompanyKey("Pvt")).toBe("pvt");
    expect(tpoCompanyKey("")).toBe("");
  });

  it("normalizes punctuation and repeated whitespace without joining words", () => {
    expect(tpoCompanyKey("  A.C.M.E.   Labs Pvt Ltd ")).toBe("a c m e labs");
    expect(tpoCompanyKey("Foo-Bar Inc.")).toBe("foo bar");
  });
});

describe("T-S1-02 owned-drive lead stage", () => {
  const lead = {
    manualStage: "NEW", recruiterUserId: null, inviteSentAt: null,
    inviteClickedAt: null, companyRelationshipId: "relationship-a",
  };
  const jobs = [
    { jobId: "job-a", relationshipId: "relationship-a" },
    { jobId: "job-b", relationshipId: "relationship-b" },
  ];
  const rows = [
    { jobId: "job-b", jobStatus: "PUBLISHED", archivedAt: null,
      offerStatus: "ACCEPTED", joiningStatus: "JOINED" },
  ];
  it("does not credit an unrelated recruiter with another contact's hired drive", () => {
    expect(deriveOwnRecruiterLeadStage(lead, jobs, rows)).toBe("NEW");
    expect(deriveOwnRecruiterLeadStage(
      { ...lead, companyRelationshipId: null }, jobs, rows,
    )).toBe("NEW");
  });
  it("derives RECRUITED only from own accepted offer evidence", () => {
    const own = { ...rows[0], jobId: "job-a" };
    expect(deriveOwnRecruiterLeadStage(lead, jobs, [own])).toBe("RECRUITED");
    expect(deriveOwnRecruiterLeadStage(
      { ...lead, manualStage: "NOT_NOW" }, jobs, [own],
    )).toBe("NOT_NOW");
  });
  it("preserves invite click and explicit joined precedence", () => {
    expect(deriveOwnRecruiterLeadStage(
      { ...lead, inviteClickedAt: new Date("2026-10-16T00:00:00Z") }, jobs, [],
    )).toBe("INVITED");
    expect(deriveOwnRecruiterLeadStage(
      { ...lead, recruiterUserId: "member" }, jobs, [],
    )).toBe("JOINED");
  });
});

describe("T-S1-02 derived pipeline precedence", () => {
  it("NOT_NOW always overrides a drive that recruited and planned", () => {
    const lead = {
      manualStage: "NOT_NOW", recruiterUserId: "recruiter",
      inviteSentAt: new Date("2026-10-10T00:00:00Z"),
      inviteClickedAt: null, companyRelationshipId: "rel-a",
    };
    expect(deriveOwnRecruiterLeadStage(lead, [
      { jobId: "job-a", relationshipId: "rel-a" },
    ], [{
      jobId: "job-a", jobStatus: "PUBLISHED", archivedAt: null,
      offerStatus: "ACCEPTED", joiningStatus: "JOINED",
    }])).toBe("NOT_NOW");
  });
});
