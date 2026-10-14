import { describe, expect, it } from "vitest";
import { filterLearnerProjectActivity, learnerProjectActivityCategory } from "@/modules/projects/learner-project-activity-filter-model";
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
