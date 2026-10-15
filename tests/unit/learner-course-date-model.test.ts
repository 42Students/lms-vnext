import { describe, expect, it } from "vitest";
import { formatLearnerCourseMoment } from "@/modules/courses/learner-course-date-model";

describe("learner course deadline and class times", () => {
  it("uses IST for the same persisted instant", () => {
    const instant = new Date("2026-10-15T23:30:00.000Z");
    const actual = formatLearnerCourseMoment(instant);
    const expected = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
    }).format(instant);
    expect(actual).toBe(expected);
    expect(actual).toContain("16 Oct 2026");
  });
  it("does not present invalid or unknown dates as true deadlines", () => {
    expect(formatLearnerCourseMoment("not-an-instant")).toBeNull();
    expect(formatLearnerCourseMoment(null)).toBeNull();
  });
});
