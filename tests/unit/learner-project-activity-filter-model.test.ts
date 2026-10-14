import { describe, expect, it } from "vitest";
import { filterLearnerProjectActivity, learnerProjectActivityCategory, parseLearnerProjectActivityFilters, learnerProjectActivityDateBounds, learnerProjectActivityPrefixes } from "@/modules/projects/learner-project-activity-filter-model";
describe("learner Project Activity categories", () => {
  it("keeps task edits and task submissions in the task source category", () => {
    const events = [{ eventType: "projects.task.created" }, { eventType: "projects.task.submitted" }, { eventType: "projects.task.reviewed" }];
    expect(filterLearnerProjectActivity(events, "TASK")).toEqual(events);
    expect(filterLearnerProjectActivity(events, "SUBMISSION")).toEqual([]);
    expect(events).toHaveLength(3);
  });
  it("classifies sprint, team, meeting, resource and delivery events", () => {
    expect(learnerProjectActivityCategory("projects.sprint.updated")).toBe("SPRINT");
    expect(learnerProjectActivityCategory("projects.mentor.reassigned")).toBe("TEAM");
    expect(learnerProjectActivityCategory("projects.meeting.decided")).toBe("TEAM");
    expect(learnerProjectActivityCategory("projects.resource.created")).toBe("RESOURCE");
    expect(learnerProjectActivityCategory("projects.project.archived")).toBe("PROJECT");
    expect(learnerProjectActivityCategory("projects.delivery.reviewed")).toBe("SUBMISSION");
    expect(learnerProjectActivityCategory("placements.task.created")).toBe("OTHER");
  });
  it("keeps unknown event types in All and handles invalid or repeated query values", () => {
    const events = [{ eventType: "projects.future.event" }];
    expect(filterLearnerProjectActivity(events, "invalid")).toEqual(events);
    expect(filterLearnerProjectActivity(events, ["TASK"])).toEqual(events);
    expect(filterLearnerProjectActivity(events, "TASK")).toEqual([]);
    expect(filterLearnerProjectActivity([], "ALL")).toEqual([]);
  });
});

describe("Project Activity IST date boundaries", () => {
  it("includes the entire selected IST end date and handles year rollover", () => {
    const parsed = parseLearnerProjectActivityFilters({ from: "2026-12-31", to: "2026-12-31" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) throw new Error("Expected valid range");
    const bounds = learnerProjectActivityDateBounds(parsed.data);
    expect(bounds.from?.toISOString()).toBe("2026-12-30T18:30:00.000Z");
    expect(bounds.until?.toISOString()).toBe("2026-12-31T18:30:00.000Z");
  });
  it("rejects reversed, impossible and repeated date parameters", () => {
    expect(parseLearnerProjectActivityFilters({ from: "2026-10-15", to: "2026-10-14" }).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({ from: "2026-02-30" }).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({ from: ["2026-10-14"] }).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({ category: "forged" }).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({ from: "", to: "" }).success).toBe(true);
  });
  it("keeps database prefix filters equivalent to pure categories", () => {
    for (const type of ["projects.task.submitted", "projects.delivery.reviewed", "projects.meeting.decided", "projects.project.archived"]) {
      const category = learnerProjectActivityCategory(type);
      if (category === "OTHER") throw new Error("Expected category");
      expect(learnerProjectActivityPrefixes(category).some(prefix => type.startsWith(prefix))).toBe(true);
    }
  });
});
