import {
  describe,
  expect,
  it,
} from "vitest";

import {
  evaluateCollegeReadiness,
  type CollegeReadinessFacts,
} from "@/modules/colleges/readiness-model";

const completeFacts: CollegeReadinessFacts = {
  collegeStatus: "ACTIVE",
  adminMemberships: 1,
  departments: 2,
  programs: 3,
  cohorts: 4,
  enrolledLearners: 50,
  facultyMemberships: 5,
  tpoMemberships: 1,
  activePlacementSeasons: 1,
  verifiedPrimaryDomains: 1,
};

describe("Super Admin college readiness model", () => {
  it("reports ready only when all ten checks pass", () => {
    const evaluation =
      evaluateCollegeReadiness(
        completeFacts,
      );

    expect(evaluation.overall).toBe(
      "READY",
    );
    expect(evaluation.counts).toEqual({
      total: 10,
      passed: 10,
      failed: 0,
      unknown: 0,
    });

    expect(
      evaluation.checks.every(
        (check) =>
          check.status === "PASS",
      ),
    ).toBe(true);
  });

  it("treats zero as a verified failure, never unknown or pass", () => {
    const evaluation =
      evaluateCollegeReadiness({
        ...completeFacts,
        facultyMemberships: 0,
        activePlacementSeasons: 0,
      });

    expect(evaluation.overall).toBe(
      "NOT_READY",
    );
    expect(evaluation.counts.failed).toBe(
      2,
    );

    expect(
      evaluation.checks.find(
        (check) =>
          check.id === "FACULTY",
      )?.status,
    ).toBe("FAIL");
  });

  it("treats unavailable data as unknown, never pass", () => {
    const evaluation =
      evaluateCollegeReadiness({
        ...completeFacts,
        adminMemberships: null,
        verifiedPrimaryDomains: null,
      });

    expect(evaluation.overall).toBe(
      "INCOMPLETE",
    );
    expect(evaluation.counts).toEqual({
      total: 10,
      passed: 8,
      failed: 0,
      unknown: 2,
    });
  });

  it("does not report ready when failures and unknowns coexist", () => {
    const evaluation =
      evaluateCollegeReadiness({
        ...completeFacts,
        enrolledLearners: 0,
        cohorts: null,
      });

    expect(evaluation.overall).toBe(
      "NOT_READY",
    );
    expect(evaluation.counts.failed).toBe(
      1,
    );
    expect(evaluation.counts.unknown).toBe(
      1,
    );
  });

  it("fails archived colleges even when every count is positive", () => {
    const evaluation =
      evaluateCollegeReadiness({
        ...completeFacts,
        collegeStatus: "ARCHIVED",
      });

    expect(evaluation.overall).toBe(
      "NOT_READY",
    );
    expect(
      evaluation.checks[0],
    ).toMatchObject({
      id: "COLLEGE_ACTIVE",
      status: "FAIL",
    });
  });

  it("does not infer an active college from missing status", () => {
    const evaluation =
      evaluateCollegeReadiness({
        ...completeFacts,
        collegeStatus: null,
      });

    expect(evaluation.overall).toBe(
      "INCOMPLETE",
    );
    expect(
      evaluation.checks[0].status,
    ).toBe("UNKNOWN");
  });

  it("does not mutate supplied facts", () => {
    const original = {
      ...completeFacts,
    };

    evaluateCollegeReadiness(
      completeFacts,
    );

    expect(completeFacts).toEqual(
      original,
    );
  });
});
