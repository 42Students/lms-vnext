import { describe, expect, it } from "vitest";
import { singleValueMentorFilters } from "@/modules/projects/mentor-filter-query";

describe("chat-11 mentor filter regression boundary", () => {
  it("MEN-projects-meetings-55 preserves legitimate resource search filters", () => {
    expect(singleValueMentorFilters({
      required: "REQUIRED", link: "HTTPS", description: "RECORDED",
      order: "TITLE", search: "brief", page: "2",
    })).toEqual({
      required: "REQUIRED", link: "HTTPS", description: "RECORDED",
      order: "TITLE", search: "brief", page: "2",
    });
    expect(singleValueMentorFilters({ required: ["ALL", "REQUIRED"] })).toBeNull();
  });

  it("MEN-projects-meetings-59 retains status, type and outcome filter values", () => {
    expect(singleValueMentorFilters({
      status: "SCHEDULED", type: "REVIEW", outcome: "RECORDED",
    })).toEqual({ status: "SCHEDULED", type: "REVIEW", outcome: "RECORDED" });
    expect(singleValueMentorFilters({ outcome: ["RECORDED", "NOT_RECORDED"] })).toBeNull();
  });

  it("MEN-projects-meetings-60 rejects contradictory activity view and paging", () => {
    expect(singleValueMentorFilters({ view: ["TASKS", "TEAM"] })).toBeNull();
    expect(singleValueMentorFilters({ page: ["1", "2"] })).toBeNull();
    expect(singleValueMentorFilters({ view: "TASKS", page: "2" }))
      .toEqual({ view: "TASKS", page: "2" });
  });

  it("MEN-projects-meetings-72 rejects ambiguous queue age and priority", () => {
    expect(singleValueMentorFilters({ age: ["LAST_7_DAYS", "OLDER_THAN_30_DAYS"] }))
      .toBeNull();
    expect(singleValueMentorFilters({ priority: ["HIGH", "LOW"] })).toBeNull();
    expect(singleValueMentorFilters({ importance: "HIGH", version: "1", assignment: "PRIMARY" }))
      .toEqual({ importance: "HIGH", version: "1", assignment: "PRIMARY" });
  });

  it("MEN-projects-meetings-77 ignores unrelated legacy bookmark keys", () => {
    expect(singleValueMentorFilters({ deprecatedLegacySelector: ["a", "b"], search: "notes" }))
      .toEqual({ search: "notes" });
  });
});
