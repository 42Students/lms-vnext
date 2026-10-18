import { describe, expect, it } from "vitest";
import { buildSuperAdminReadinessCsv } from "@/modules/colleges/admin-readiness-export-model";
import { evaluateCollegeReadiness } from "@/modules/colleges/readiness-model";

const facts = {
  collegeStatus: "ACTIVE" as const,
  adminMemberships: 1,
  departments: 1,
  programs: 1,
  cohorts: 1,
  enrolledLearners: 1,
  facultyMemberships: 1,
  tpoMemberships: 1,
  activePlacementSeasons: 1,
  verifiedPrimaryDomains: 1,
};

describe("Super Admin readiness evidence CSV", () => {
  it("SA-COL-READINESS-CSV-01 neutralizes attacker-controlled college names and evidence behind invisible prefixes", () => {
    const evaluation = evaluateCollegeReadiness(facts);
    evaluation.checks[0].evidence = "\u200b=BAD";
    evaluation.checks[0].remediation = "\u0000@FORMULA";
    const csv = buildSuperAdminReadinessCsv({
      name: " \u2060+ATTACK",
      code: "tenant-one",
    }, evaluation);
    expect(csv).toContain('"\' \u2060+ATTACK"');
    expect(csv).toContain('"\'\u200b=BAD"');
    expect(csv).toContain('"\'\u0000@FORMULA"');
    expect(csv).toContain('"tenant-one"');
    expect(csv.split("\r\n")).toHaveLength(12);
  });

  it("SA-COL-READINESS-CSV-02 exports all ten checks and escapes quoted evidence without pretending runtime is verified", () => {
    const evaluation = evaluateCollegeReadiness({
      ...facts, verifiedPrimaryDomains: null, departments: 0,
    });
    evaluation.checks[0].evidence = 'Quoted "source"';
    const csv = buildSuperAdminReadinessCsv({
      name: "IIT Dharwad", code: "iit-dharwad",
    }, evaluation);
    expect(evaluation.overall).toBe("NOT_READY");
    expect(csv).toContain('Quoted ""source""');
    expect(csv).toContain('"UNKNOWN"');
    expect(csv).toContain('"FAIL"');
    expect(csv).not.toContain("Runtime verified");
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(11);
  });
});
