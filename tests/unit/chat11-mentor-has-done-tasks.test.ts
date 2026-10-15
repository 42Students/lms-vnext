
import { describe, expect, it } from "vitest";
import { matchesMentorProjectWork } from "@/modules/projects/mentor-project-work-model";
import { mentorProjectListQuerySchema } from "@/modules/projects/mentor-project-list-query";
describe("Mentor recorded completion filter", () => {
  it("distinguishes completed work from untracked or only open work", () => {
    expect(matchesMentorProjectWork("HAS_DONE_TASKS", undefined)).toBe(false);
    expect(matchesMentorProjectWork("HAS_DONE_TASKS", {total:0,open:0})).toBe(false);
    expect(matchesMentorProjectWork("HAS_DONE_TASKS", {total:4,open:4})).toBe(false);
    expect(matchesMentorProjectWork("HAS_DONE_TASKS", {total:4,open:2})).toBe(true);
  });
  it("permits the filter at the URL boundary", () => {
    expect(mentorProjectListQuerySchema.parse({work:"HAS_DONE_TASKS"}).work).toBe("HAS_DONE_TASKS");
  });
});
