import { describe, expect, it } from "vitest";
import { learnerQuizDeadlineDisplay } from "@/modules/courses/learner-quiz-deadline-display-model";
describe("standalone quiz absolute deadlines", () => {
  it("shows the college-local date when a UTC deadline crosses midnight", () => {
    const due = "2026-10-15T23:45:00Z";
    const expected = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
    }).format(new Date(due));
    expect(learnerQuizDeadlineDisplay(due)).toBe(expected);
    expect(expected).toContain("16 Oct 2026");
  });
  it("distinguishes no deadline from a malformed persisted instant", () => {
    expect(learnerQuizDeadlineDisplay(null)).toBe("No deadline");
    expect(learnerQuizDeadlineDisplay("broken")).toBe("Deadline unavailable");
  });
});
