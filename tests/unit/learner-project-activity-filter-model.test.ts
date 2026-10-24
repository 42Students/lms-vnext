import { describe, expect, it } from "vitest";
import { filterLearnerProjectActivity, learnerProjectActivityCategory, parseLearnerProjectActivityFilters, learnerProjectActivityDateBounds, learnerProjectActivityPrefixes, learnerProjectActivityPageHref } from "@/modules/projects/learner-project-activity-filter-model";
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
  it("keeps SQL category prefixes aligned with the full Mentor event taxonomy",()=>{
    for(const [type,expected] of [
      ["projects.release.shipped","SPRINT"],
      ["projects.task_comment.added","TASK"],
      ["projects.team_member.removed","TEAM"],
      ["projects.resource_file.uploaded","RESOURCE"],
      ["projects.file.shared","RESOURCE"],
      ["projects.evaluation.changed","PROJECT"],
      ["projects.mentor_update.posted","PROJECT"],
    ] as const){
      expect(learnerProjectActivityCategory(type)).toBe(expected);
      expect(learnerProjectActivityPrefixes(expected).some(prefix=>
        type.startsWith(prefix))).toBe(true);
    }
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

describe("Activity cursor URL boundary", () => {
  it("preserves filters and exact PG microseconds while replacing the cursor", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const time = "2026-10-14T10:00:00.123456Z";
    const href = learnerProjectActivityPageHref("project", { category: "TASK", from: "2026-10-14" }, { id, time });
    const query = new URL(href, "https://example.test").searchParams;
    expect(query.get("activityBeforeTime")).toBe(time);
    expect(query.get("activityBeforeId")).toBe(id);
    expect(query.get("activityFrom")).toBe("2026-10-14");
    expect(query.get("activityCategory")).toBe("TASK");
    expect(learnerProjectActivityPageHref("project", { category: "TASK", beforeTime: time, beforeId: id })).not.toContain("activityBefore");
  });
  it("preserves authorized sprint selection through paginated activity URLs",()=>{
    const sprintId="00000000-0000-4000-8000-000000000002";
    const actorId="00000000-0000-4000-8000-000000000003";
    const parsed=parseLearnerProjectActivityFilters({sprintId,actorUserId:actorId});
    expect(parsed.success).toBe(true);
    if(!parsed.success)throw new Error("Expected scoped activity filters");
    const url=new URL(learnerProjectActivityPageHref("project",parsed.data),
      "https://example.test");
    expect(url.searchParams.get("activitySprintId")).toBe(sprintId);
    expect(parseLearnerProjectActivityFilters({sprintId:"not-a-uuid"}).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({sprintId:[sprintId]}).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({sprintId:""}).success).toBe(true);
  });
  it("rejects half cursors, repeated timestamps and forged IDs", () => {
    expect(parseLearnerProjectActivityFilters({ beforeTime: "2026-10-14T10:00:00Z" }).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({ beforeTime: "2026-10-14T10:00:00Z", beforeId: "forged" }).success).toBe(false);
    expect(parseLearnerProjectActivityFilters({ beforeTime: ["2026-10-14T10:00:00Z"] }).success).toBe(false);
  });
});
