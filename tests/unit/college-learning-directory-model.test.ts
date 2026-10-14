import { describe, expect, it } from "vitest";
import {
  collegeLearningHref,
  collegeLearningPageCount,
  collegeLearningQuerySchema,
  collegeLessonQuerySchema,
  collegeProgressQuerySchema,
  collegeProgressDescription,
} from "@/modules/courses/college-learning-directory-model";

describe("College Admin lessons and course progress pure models", () => {
  it("defaults to active rows and strict college-independent query boundaries", () => {
    expect(collegeLearningQuerySchema.parse({}))
      .toEqual({ q: "", status: "ACTIVE", page: 1 });
    expect(collegeLearningQuerySchema.parse({
      q: "  sample  ", status: "ARCHIVED", page: "3",
    })).toEqual({ q: "sample", status: "ARCHIVED", page: 3 });
    for (const invalid of [
      { collegeId: "foreign" },
      { page: -1 },
      { page: 1001 },
      { status: "PUBLISHED" },
      { offeringStatus: "SUSPENDED" },
      { q: "x".repeat(101) },
    ]) {
      expect(collegeLearningQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("generates only fixed role-safe routes with escaped search", () => {
    const query = {
      q: "a & b", status: "ALL" as const, page: 2,
    };
    const lessons = new URL(collegeLearningHref("LESSONS", query), "https://example.test");
    const progress = new URL(collegeLearningHref("PROGRESS", query), "https://example.test");
    expect(lessons.pathname).toBe("/college/lessons");
    expect(progress.pathname).toBe("/college/course-progress");
    expect(progress.searchParams.get("q")).toBe("a & b");
    expect(collegeProgressQuerySchema.safeParse({courseCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({programCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({cohortCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({cohortCode:"B-2026"})))
      .toContain("cohortCode=B-2026");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({periodCode:"2026-FALL"})))
      .toContain("periodCode=2026-FALL");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({programCode:"CS & EE"})))
      .toContain("programCode=CS+%26+EE");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({courseCode:"CS 101"})))
      .toContain("courseCode=CS+101");
    const lifecycle = collegeLessonQuerySchema.parse({ offeringStatus: "ARCHIVED" });
    expect(collegeLearningHref("LESSONS", lifecycle)).toContain("offeringStatus=ARCHIVED");
    expect(collegeLessonQuerySchema.safeParse({ offeringStatus: "SUSPENDED" }).success).toBe(false);
    expect(collegeLessonQuerySchema.parse({pathStatus:"PUBLISHED"}).pathStatus).toBe("PUBLISHED");
    expect(collegeLessonQuerySchema.safeParse({ pathStatus: "ACTIVE" }).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({pathStatus:"ARCHIVED"})))
      .toContain("pathStatus=ARCHIVED");
    expect(collegeLessonQuerySchema.safeParse({ courseCode: "x".repeat(65) }).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({ programCode: "x".repeat(65) }).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({ periodCode: "x".repeat(65) }).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({periodCode:"2026-FALL"})))
      .toContain("periodCode=2026-FALL");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({programCode:"PROG & CS"})))
      .toContain("programCode=PROG+%26+CS");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({courseCode:"CS 101"})))
      .toContain("courseCode=CS+101");
    expect(progress.searchParams.has("collegeId")).toBe(false);
    expect(collegeLearningHref("LESSONS", {
      q: "", status: "ACTIVE", page: 1,
    })).toBe("/college/lessons");
  });

  it("distinguishes recorded activity from eligible-learner completion", () => {
    expect(collegeProgressDescription({
      recordedRows: 0, completedRows: 0, learnersWithRecords: 0,
    })).toBe("No recorded learner content activity");
    expect(collegeProgressDescription({
      recordedRows: 5, completedRows: 3, learnersWithRecords: 2,
    })).toBe("3 completed content records of 5; 2 distinct learners with records");
    expect(collegeLearningPageCount(0)).toBe(1);
    expect(collegeLearningPageCount(26)).toBe(2);
  });
});
