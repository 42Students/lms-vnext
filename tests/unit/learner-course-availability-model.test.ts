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
    // Read-only course cards expose the lock reason and no nested action.
    expect(source).toContain('{blockedReason ? (');
    expect(source).toContain('<p role="status" className="m-0 text-xs text-warning">{blockedReason}</p>');
    expect(source).not.toContain("learnerCourseNextItemHref(row)");
    expect(source).not.toContain('aria-disabled={blocked}');
  });
});
