import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { learnerCourseUnavailableReason } from "@/modules/courses/learner-course-availability-model";

const course = {
  courseEnabled: true,
  courseAllowedForDisplay: 1,
  courseStatus: "ACTIVE",
};

describe("Learner course availability and locked-card navigation", () => {
  it("allows active courses in the current semester", () => {
    expect(learnerCourseUnavailableReason({ readOnly: false, course })).toBeNull();
  });

  it("announces policy locks even when a course was not marked read-only", () => {
    expect(learnerCourseUnavailableReason({
      readOnly: false, course: { ...course, courseEnabled: false },
    })).toBe("Content locked: not visible to students");
    expect(learnerCourseUnavailableReason({
      readOnly: false, course: { ...course, courseAllowedForDisplay: 0 },
    })).toBe("Content locked: not visible to students");
  });

  it("preserves inactive and past-semester reasons without hiding policy locks", () => {
    expect(learnerCourseUnavailableReason({
      readOnly: true, course: { ...course, courseStatus: "ARCHIVED" },
    })).toBe("Course inactive: shown for reference");
    expect(learnerCourseUnavailableReason({ readOnly: true, course }))
      .toBe("Not your current semester: shown for reference");
    expect(learnerCourseUnavailableReason({
      readOnly: true, course: { ...course, courseEnabled: false, courseStatus: "ARCHIVED" },
    })).toBe("Content locked: not visible to students");
  });

  it("does not leave locked cards or their secondary CTAs as interactive links", () => {
    const source = readFileSync(
      "src/components/courses/learner-course-list.tsx", "utf8",
    );
    expect(source).toContain('return <div role="group" aria-disabled="true"');
    expect(source).toContain('title={blockedReason}');
    expect(source).toContain('return <Link href={href}');
    expect(source).toContain('<LearnerCourseCardSurface');
    expect(source).toContain('blockedReason={blockedReason}');
    expect(source).toContain('{blockedReason?<p role="status"');
    expect(source).toContain('{!blocked && row.firstOverdue');
    expect(source).toContain('{!blocked&&learnerCourseNextItemHref(row)');
    expect(source).not.toContain('aria-disabled={blocked}');
  });
});
