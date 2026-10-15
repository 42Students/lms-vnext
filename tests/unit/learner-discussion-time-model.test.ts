import { describe, expect, it } from "vitest";
import { learnerDiscussionTimeLabel } from "@/modules/courses/learner-discussion-time-model";

describe("Learner discussion timestamps", () => {
  it("includes the year and Asia/Kolkata zone to disambiguate history", () => {
    const text = learnerDiscussionTimeLabel("2026-10-15T23:45:00.000Z");
    expect(text).toContain("16 Oct 2026");
    expect(text).toMatch(/IST|GMT\+5:30/);
  });
  it("uses an honest fallback for malformed timestamps", () => {
    expect(learnerDiscussionTimeLabel("bad date")).toBe("Time unavailable");
  });
});
