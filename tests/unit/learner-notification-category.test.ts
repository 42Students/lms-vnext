import { describe, expect, it } from "vitest";
import {
  learnerNotificationCategory,
  learnerNotificationCategoryCounts,
} from "@/modules/activity/learner-notification-category";

describe("learner legacy notification tabs", () => {
  it("separates course, project, placement and announcement sources", () => {
    expect(learnerNotificationCategory({ module: "COURSES" })).toBe("course");
    expect(learnerNotificationCategory({ module: "PROJECTS" })).toBe("project");
    expect(learnerNotificationCategory({ module: "PLACEMENTS" })).toBe("job");
    expect(learnerNotificationCategory({ module: "ACADEMICS" })).toBe("general");
    expect(learnerNotificationCategory({ module: "COURSES", source: "ANNOUNCEMENT" })).toBe("general");
  });
  it("counts all combined sources without double counting", () => {
    expect(learnerNotificationCategoryCounts([
      { module: "COURSES" }, { module: "PROJECTS" },
      { module: "PLACEMENTS" }, { module: "ACADEMICS" },
      { module: "ANNOUNCEMENTS", source: "ANNOUNCEMENT" },
    ])).toEqual({ all: 5, course: 1, project: 1, general: 2, job: 1 });
  });
  it("is case insensitive for activity modules", () => {
    expect(learnerNotificationCategory({ module: "courses" })).toBe("course");
  });
});
