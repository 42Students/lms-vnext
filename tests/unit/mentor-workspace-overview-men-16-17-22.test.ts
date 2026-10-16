import { describe, expect, it } from "vitest";
import { mentorAuthoredBrief, mentorReviewSubmissionHref } from "@/modules/projects/mentor-overview-presenter";

describe("MEN-projects-meetings-16/17/22 mentor overview and delivery links", () => {
  it("renders authored goal, description and deliverables without mutating version-pinned input", () => {
    const source = {
      goal: "Build an LMS product",
      description: "Make a release-ready project",
      deliverables: ["Working web app", "Test evidence"],
    };
    const preview = mentorAuthoredBrief(source);
    expect(preview).toEqual({
      goal: source.goal,
      description: source.description,
      deliverables: ["Working web app", "Test evidence"],
    });
    expect(source.deliverables).toEqual(["Working web app", "Test evidence"]);
  });

  it("handles missing template overview without fabricating a goal", () => {
    expect(mentorAuthoredBrief(null)).toEqual({
      goal: null, description: null, deliverables: [],
    });
  });

  it("opens the mentor final-submission review from overview and board only when submitted", () => {
    const id = "abc-123";
    expect(mentorReviewSubmissionHref(id, [{ status: "SUBMITTED" }]))
      .toBe("/mentor/projects/abc-123?tab=delivery");
    expect(mentorReviewSubmissionHref(id, [{ status: "DRAFT" }])).toBeNull();
    expect(mentorReviewSubmissionHref(id, [{ status: "APPROVED" }])).toBeNull();
    expect(mentorReviewSubmissionHref(id, [])).toBeNull();
    expect(mentorReviewSubmissionHref("space & project", [
      { status: "CHANGES_REQUESTED" }, { status: "SUBMITTED" },
    ])).toBe("/mentor/projects/space%20%26%20project?tab=delivery");
  });
});
