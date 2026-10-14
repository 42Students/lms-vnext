import { describe, expect, it } from "vitest";
import { buildOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-model";

describe("Learner own academic identity", () => {
  it("shows persisted college enrollment data without inventing a title", () => {
    expect(buildOwnLearnerAcademicSummary({
      displayName: "  Student Name ",
      programName: "Computer Science",
      programCode: "CSE",
      cohortName: "2026 intake",
      departmentName: "Engineering",
    })).toEqual({
      title: "Student Name",
      enrollment: {
        program: "Computer Science",
        programCode: "CSE",
        cohort: "2026 intake",
        department: "Engineering",
      },
    });
  });
  it("distinguishes missing enrollment from finishing studies", () => {
    expect(buildOwnLearnerAcademicSummary({
      displayName: null,
      programName: null,
      programCode: null,
      cohortName: null,
      departmentName: null,
    })).toEqual({
      title: "Name not recorded",
      enrollment: null,
    });
  });
});
