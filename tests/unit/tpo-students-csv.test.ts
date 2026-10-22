import { describe, expect, it } from "vitest";

import {
  exportTpoStudentsCsv,
  tpoStudentCsvCell,
} from "@/modules/placements/tpo-students-csv";

import {
  deriveTpoStudent,
  type TpoStudentSource,
} from "@/modules/placements/tpo-students-model";

import { resolvePlacementParticipation } from "@/modules/placements/batch-eligibility-policy";

describe("TPO Students CSV safety", () => {
  it("quotes ordinary, comma-containing and quoted values", () => {
    expect(tpoStudentCsvCell("Hello")).toBe('"Hello"');
    expect(tpoStudentCsvCell('A, "B"')).toBe('"A, ""B"""');
    expect(tpoStudentCsvCell(null)).toBe('""');
  });

  it("neutralizes spreadsheet formula prefixes", () => {
    for (const dangerous of [
      "=1+1",
      "+SUM(A1:A2)",
      "-10+20",
      "@SUM(1,2)",
      "  =1+1",
      "\t=1+1",
      "\n=1+1",
      "﻿=1+1",
    ]) {
      const encoded = tpoStudentCsvCell(dangerous);

      expect(encoded.startsWith('"\'')).toBe(true);
      expect(encoded.endsWith('"')).toBe(true);
    }
  });

  it("normalizes carriage returns and quotes multiline data", () => {
    expect(
      tpoStudentCsvCell('First\r\n"Second"'),
    ).toBe('"First\n""Second"""');
  });

  it("exports only selected rows with stable column order", () => {
    const now = new Date("2026-10-14T00:00:00Z");

    const source: TpoStudentSource = {
      membershipId: "learner-1",
      displayName: '=HYPERLINK("https://invalid.test")',
      email: "learner@example.test",
      rollNumber: "42",
      registrationNumber: null,
      branchId: "branch-1",
      branchName: "Computer Science",
      programId: "program-btech",
      programName: "B.Tech",
      classIds: [],
      verification: { status: "UNKNOWN", waitingSections: [], verifiedSections: [] },
      cohortId: "cohort-1",
      cohortName: "2026",
      registrationChoice: "PLACEMENTS",
      participation: resolvePlacementParticipation({
        learner: {
          status: "ELIGIBLE",
          reason: null,
          note: null,
          decidedAt: now,
        },
        section: null,
        cohort: null,
      }),
      academicEvidence: {
        cgpaHundredths: 800,
        activeBacklogs: 0,
        pastBacklogs: null,
      },
      preferencesPresent: true,
      applications: [],
      offers: [],
      appliedResults: [],
      verifiedExternalOfferCount: 0,
      ambiguousSection: false,
    };

    const row = deriveTpoStudent(source, now);
    const csv = exportTpoStudentsCsv([row]);

    expect(csv).toContain('"Student","Roll no.","Batch","Class","Branch","Stage","After college","Profile"');
    expect(csv).toContain(
      `"'=HYPERLINK(""https://invalid.test"")"`,
    );
    expect(csv).toContain('"8"');
    expect(csv).toContain('"Ready, not applying"');
    expect(csv).not.toContain('"READY_NOT_APPLYING"');
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv).toContain('"B.Tech · 2026"');

    expect(exportTpoStudentsCsv([]).split("\r\n"))
      .toHaveLength(2);
  });
});
