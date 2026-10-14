import { describe, expect, it } from "vitest";
import {
  collegeRoleDirectoryHref,
  collegeRoleDirectoryQuerySchema,
  describeCollegeDirectoryContext,
  collegeDirectorySearchHint,
} from "@/modules/people/college-role-directory-model";

describe("College Admin Faculty/Students directory helpers", () => {
  it("describes learner identifier search without exposing it as a filter for Faculty", () => {
    expect(collegeDirectorySearchHint("LEARNER")).toContain("program or batch");
    expect(collegeDirectorySearchHint("FACULTY")).toContain("department");
  });
  it("parses status/search/page filters and forbids caller-controlled college", () => {
    expect(collegeRoleDirectoryQuerySchema.parse({})).toEqual({
      q: "", status: "ALL", accountStatus: "ALL", enrollment: "ALL", teaching: "ALL", sort: "NAME", page: 1,
    });
    expect(collegeRoleDirectoryQuerySchema.parse({
      q: "  test  ", status: "SUSPENDED", accountStatus: "DISABLED", page: "3",
    })).toEqual({
      q: "test", status: "SUSPENDED", accountStatus: "DISABLED", enrollment: "ALL", teaching: "ALL", sort: "NAME", page: 3,
    });
    for (const invalid of [
      { collegeId: "foreign" },
      { page: 0 },
      { page: 10001 },
      { status: "DISABLED" }, { accountStatus: "SUSPENDED" }, { enrollment: "ARCHIVED" }, { teaching: "RETIRED" }, { facultyDepartmentId:"bad" }, {sort:"RANDOM"},
      { q: "x".repeat(101) },
    ]) {
      expect(collegeRoleDirectoryQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("builds only role-specific relative routes with escaped parameters", () => {
    const query = { q: "a & b", status: "ACTIVE" as const, accountStatus: "DISABLED" as const,
      enrollment: "ACTIVE" as const, teaching: "ASSIGNED" as const, facultyDepartmentId:"10000000-0000-4000-8000-000000000001", sort:"NEWEST" as const, page: 2 };
    const faculty = new URL(collegeRoleDirectoryHref("FACULTY", query), "https://example.test");
    const students = new URL(collegeRoleDirectoryHref("LEARNER", query), "https://example.test");
    expect(faculty.pathname).toBe("/college/faculty");
    expect(students.pathname).toBe("/college/students");
    expect(students.searchParams.get("q")).toBe("a & b");
    expect(students.searchParams.get("page")).toBe("2");
    expect(students.searchParams.get("sort")).toBe("NEWEST");
    expect(students.searchParams.get("accountStatus")).toBe("DISABLED");
    expect(students.searchParams.get("enrollment")).toBe("ACTIVE");
    expect(faculty.searchParams.has("enrollment")).toBe(false);
    expect(faculty.searchParams.get("teaching")).toBe("ASSIGNED");
    expect(faculty.searchParams.get("facultyDepartmentId")).toBe(query.facultyDepartmentId);
    expect(students.searchParams.has("facultyDepartmentId")).toBe(false);
    expect(students.searchParams.has("teaching")).toBe(false);
    expect(students.searchParams.has("collegeId")).toBe(false);
    expect(collegeRoleDirectoryHref("LEARNER", {
      q: "", status: "ALL", accountStatus: "ALL", enrollment: "ALL", teaching: "ALL", sort:"NAME", page: 1,
    })).toBe("/college/students");
  });

  it("describes real teaching counts without treating them as workload", () => {
    const row = {
      program: null,
      cohort: null,
      sections: [],
      activeTeachingAssignments: 1,
    };
    expect(describeCollegeDirectoryContext("FACULTY", row))
      .toBe("1 active course teaching assignment");
    expect(describeCollegeDirectoryContext("FACULTY", {
      ...row, activeTeachingAssignments: 0,
    })).toBe("0 active course teaching assignments");
  });

  it("labels missing academic associations and deduplicates class names", () => {
    const row = {
      program: "B.Tech",
      cohort: "2026",
      sections: ["B", "A", "A"],
      activeTeachingAssignments: 0,
    };
    expect(describeCollegeDirectoryContext("LEARNER", row))
      .toBe("B.Tech · 2026 · A, B");
    expect(describeCollegeDirectoryContext("LEARNER", {
      ...row, sections: [],
    })).toContain("No active class recorded");
    expect(describeCollegeDirectoryContext("LEARNER", {
      ...row, program: null,
    })).toBe("No active program/batch enrollment recorded");
  });
});
