import { describe, expect, it } from "vitest";
import {
  collegeAssessmentHref,
  collegeAssessmentListQuerySchema,
  collegeAssessmentSummary,
  collegeAssessmentScopeLabel,
  parseCollegeAssessmentQuery,
} from "@/modules/courses/college-assessment-aggregate-model";

describe("College Admin assignment and quiz aggregate model", () => {
  it("defaults to a paginated all-status view", () => {
    expect(parseCollegeAssessmentQuery("ASSIGNMENT", {})).toEqual({
      q: "", status: "ALL", scope:"ALL", results:"ALL", duePresence:"ALL", dueWindow:"ALL", page: 1,
    });
    expect(parseCollegeAssessmentQuery("QUIZ", {})).toEqual({
      q: "", status: "ALL", scope:"ALL", results:"ALL", duePresence:"ALL", dueWindow:"ALL", page: 1,
    });
  });

  it("accepts valid filters but rejects tenant selectors, huge pages and quiz-only assignment status", () => {
    expect(parseCollegeAssessmentQuery("QUIZ", {
      q: "  unit test  ", status: "CLOSED", page: "3",
    })).toEqual({ q: "unit test", status: "CLOSED", scope:"ALL", results:"ALL", duePresence:"ALL", dueWindow:"ALL", page: 3 });
    expect(() => parseCollegeAssessmentQuery("ASSIGNMENT", {
      status: "CLOSED",
    })).toThrow();
    for (const bad of [
      { collegeId: "other-college" },
      { page: 0 },
      { page: 1001 },
      { status: "NOT_VALID" },
      { q: "x".repeat(101) },
      {courseCode:"x".repeat(65)},
      {periodCode:"x".repeat(65)},
      {cohortCode:"x".repeat(65)},
      {scope:"FOREIGN"},
      {results:"OPEN"},
      {duePresence:"UNKNOWN"},
      {dueWindow:"NEVER"},
    ]) {
      expect(collegeAssessmentListQuerySchema.safeParse(bad).success).toBe(false);
    }
  });

  it("constructs only known college routes and keeps filter values encoded", () => {
    const href = collegeAssessmentHref("QUIZ", {
      q: "one & two", status: "PUBLISHED", scope:"ALL", results:"ALL", duePresence:"ALL", dueWindow:"ALL", page: 2,
    });
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/college/quizzes");
    expect(url.searchParams.get("q")).toBe("one & two");
    expect(url.searchParams.get("status")).toBe("PUBLISHED");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.has("collegeId")).toBe(false);
    expect(collegeAssessmentHref("QUIZ",collegeAssessmentListQuerySchema.parse({cohortCode:"B&26"}))).toContain("cohortCode=B%2626");
    expect(collegeAssessmentHref("QUIZ",collegeAssessmentListQuerySchema.parse({periodCode:"FALL&26"}))).toContain("periodCode=FALL%2626");
    expect(collegeAssessmentHref("ASSIGNMENT",collegeAssessmentListQuerySchema.parse({dueWindow:"PAST"}))).toContain("dueWindow=PAST");
    expect(collegeAssessmentHref("QUIZ",collegeAssessmentListQuerySchema.parse({duePresence:"UNSCHEDULED"}))).toContain("duePresence=UNSCHEDULED");
    expect(collegeAssessmentHref("QUIZ",collegeAssessmentListQuerySchema.parse({results:"HIDDEN"}))).toContain("results=HIDDEN");
    expect(()=>parseCollegeAssessmentQuery("ASSIGNMENT",{results:"HIDDEN"})).toThrow();
    expect(collegeAssessmentHref("ASSIGNMENT",collegeAssessmentListQuerySchema.parse({scope:"SECTION"}))).toContain("scope=SECTION");
    expect(collegeAssessmentHref("QUIZ",collegeAssessmentListQuerySchema.parse({courseCode:"CS&42"}))).toContain("courseCode=CS%2642");
    expect(collegeAssessmentHref("ASSIGNMENT", {
      q: "", status: "ALL", scope:"ALL", results:"ALL", duePresence:"ALL", dueWindow:"ALL", page: 1,
    })).toBe("/college/assignments");
  });

  it("labels only actual shared or section-specific authoring scope",()=>{
    expect(collegeAssessmentScopeLabel(false)).toBe("Shared offering");
    expect(collegeAssessmentScopeLabel(true)).toBe("Section-specific");
  });

  it("reports page-scoped counts without inventing an overall activity denominator", () => {
    expect(collegeAssessmentSummary([
      { status: "PUBLISHED", activityCount: 3 },
      { status: "DRAFT", activityCount: 0 },
      { status: "PUBLISHED", activityCount: 2 },
    ])).toEqual({ displayed: 3, published: 2, activity: 5 });
    expect(collegeAssessmentSummary([])).toEqual({
      displayed: 0, published: 0, activity: 0,
    });
  });
});
