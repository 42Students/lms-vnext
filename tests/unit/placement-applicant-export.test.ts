import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlacementApplicantCsvRows,
  PLACEMENT_APPLICANTS_CSV_HEADINGS,
  type PlacementApplicantExportApplication,
} from "@/modules/placements/applicant-export-model";
import {
  placementReportCsv,
} from "@/modules/placements/report-model";

const applicant: PlacementApplicantExportApplication = {
  applicationId: "application-1",
  membershipId: "learner-1",
  studentName: "Akhil Kumar",
  rollNumber: "CSE001",
  applicationStatus: "SUBMITTED",
  screeningStatus: "SHORTLISTED",
};

describe("placement drive applicant CSV projection", () => {
  it("exports the required six columns and persisted values", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [applicant],
      branches: [
        {
          membershipId: "learner-1",
          branchName: "Computer Science",
          enrollmentStatus: "ACTIVE",
        },
      ],
      appliedResults: [
        {
          applicationId: "application-1",
          roundId: "round-1",
          sequence: 1,
          outcome: "PASS",
        },
      ],
    });

    expect(PLACEMENT_APPLICANTS_CSV_HEADINGS).toEqual([
      "Student name",
      "Roll number",
      "Branch",
      "Application status",
      "Screening status",
      "Latest round outcome",
    ]);

    expect(rows).toEqual([
      [
        "Akhil Kumar",
        "CSE001",
        "Computer Science",
        "SUBMITTED",
        "SHORTLISTED",
        "PASS",
      ],
    ]);
  });

  it("uses the highest round sequence rather than input order", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [applicant],
      branches: [],
      appliedResults: [
        {
          applicationId: "application-1",
          roundId: "round-3",
          sequence: 3,
          outcome: "FAIL",
        },
        {
          applicationId: "application-1",
          roundId: "round-1",
          sequence: 1,
          outcome: "PASS",
        },
        {
          applicationId: "application-1",
          roundId: "round-2",
          sequence: 2,
          outcome: "HOLD",
        },
      ],
    });

    expect(rows[0]?.[5]).toBe("FAIL");
  });

  it("keeps each application and never mixes outcomes between applications", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [
        applicant,
        {
          ...applicant,
          applicationId: "application-2",
          applicationStatus: "WITHDRAWN",
          screeningStatus: null,
        },
      ],
      branches: [],
      appliedResults: [
        {
          applicationId: "application-1",
          roundId: "round-2",
          sequence: 2,
          outcome: "PASS",
        },
        {
          applicationId: "other-job-application",
          roundId: "round-99",
          sequence: 99,
          outcome: "FAIL",
        },
      ],
    });

    expect(rows).toHaveLength(2);

    expect(rows[0]?.[5]).toBe("PASS");
    expect(rows[1]?.[3]).toBe("WITHDRAWN");
    expect(rows[1]?.[4]).toBe("");
    expect(rows[1]?.[5]).toBe("");
  });

  it("prefers an active branch over historical enrollments", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [applicant],
      branches: [
        {
          membershipId: "learner-1",
          branchName: "Civil Engineering",
          enrollmentStatus: "COMPLETED",
        },
        {
          membershipId: "learner-1",
          branchName: "Computer Science",
          enrollmentStatus: "ACTIVE",
        },
      ],
      appliedResults: [],
    });

    expect(rows[0]?.[2]).toBe("Computer Science");
  });

  it("retains the newest historical branch when no active enrollment exists", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [applicant],
      branches: [
        {
          membershipId: "learner-1",
          branchName: "Mechanical Engineering",
          enrollmentStatus: "COMPLETED",
        },
        {
          membershipId: "learner-1",
          branchName: "Civil Engineering",
          enrollmentStatus: "WITHDRAWN",
        },
      ],
      appliedResults: [],
    });

    expect(rows[0]?.[2]).toBe("Mechanical Engineering");
  });

  it("leaves unrecorded profile and evaluation fields blank", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [
        {
          ...applicant,
          rollNumber: null,
          screeningStatus: null,
        },
      ],
      branches: [],
      appliedResults: [],
    });

    expect(rows).toEqual([
      [
        "Akhil Kumar",
        "",
        "",
        "SUBMITTED",
        "",
        "",
      ],
    ]);
  });

  it("uses the shared formula-safe CSV serializer", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [
        {
          ...applicant,
          studentName: "=HYPERLINK(\"https://example.com\")",
          rollNumber: "+SUM(A1:A2)",
        },
      ],
      branches: [
        {
          membershipId: "learner-1",
          branchName: "@external",
          enrollmentStatus: "ACTIVE",
        },
      ],
      appliedResults: [],
    });

    const csv = placementReportCsv(
      PLACEMENT_APPLICANTS_CSV_HEADINGS,
      rows,
    );

    expect(csv).toContain(
      '"\'=HYPERLINK(""https://example.com"")"',
    );
    expect(csv).toContain('"\'+SUM(A1:A2)"');
    expect(csv).toContain('"\'@external"');
  });

  it("returns headers only when the drive has no applicants", () => {
    const rows = buildPlacementApplicantCsvRows({
      applications: [],
      branches: [],
      appliedResults: [],
    });

    expect(rows).toEqual([]);

    expect(
      placementReportCsv(
        PLACEMENT_APPLICANTS_CSV_HEADINGS,
        rows,
      ),
    ).toBe(
      PLACEMENT_APPLICANTS_CSV_HEADINGS.map(
        (heading) => `"${heading}"`,
      ).join(","),
    );
  });
});
