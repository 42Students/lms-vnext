import { describe, expect, it } from "vitest";
import { matchesMentorProjectWork } from "@/modules/projects/mentor-project-work-model";
import { mentorProjectListQuerySchema } from "@/modules/projects/mentor-project-list-query";
describe("Mentor completed recorded work filter", () => {
  it("requires at least one persisted task and no unfinished tasks", () => {
    expect(matchesMentorProjectWork("ALL_DONE", undefined)).toBe(false);
    expect(matchesMentorProjectWork("ALL_DONE", {total:0,open:0})).toBe(false);
    expect(matchesMentorProjectWork("ALL_DONE", {total:3,open:0})).toBe(true);
    expect(matchesMentorProjectWork("ALL_DONE", {total:3,open:1})).toBe(false);
  });
  it("parses the URL option through the Mentor allowlist", () => {
    expect(mentorProjectListQuerySchema.parse({work:"ALL_DONE"}).work).toBe("ALL_DONE");
  });
});
