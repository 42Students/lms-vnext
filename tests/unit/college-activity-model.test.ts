import { describe, expect, it } from "vitest";
import { activitySearchParams, collegeActivityHref, collegeActivityQuerySchema } from "@/modules/activity/college-activity-model";

const uuid = "10000000-0000-4000-8000-000000000001";
describe("College activity model", () => {
  it("strictly accepts actor, entity and date filters", () => {
    expect(collegeActivityQuerySchema.parse({
      module: "ACADEMICS", importance: "HIGH", eventType: "academics.program.updated",
      actorUserId: uuid, subjectType: "course_lesson", subjectId: uuid,
      from: "2026-10-01", to: "2026-10-14",
    })).toMatchObject({ actorUserId: uuid, subjectType: "course_lesson" });
    for (const query of [
      { q: "x".repeat(101) }, { collegeId: uuid }, { module: "FOREIGN" }, { importance: "IMPORTANT" },
      { eventType: "x".repeat(121) }, { from: "2026-02-30" }, { from: "2026-10-15", to: "2026-10-14" },
      { beforeId: uuid }, { beforeOccurredAt: "2026-10-14T12:00:00Z" },
      { actorUserId: "not-a-uuid" }, { subjectId: "not-a-uuid" },
    ]) expect(collegeActivityQuerySchema.safeParse(query).success).toBe(false);
    expect(collegeActivityQuerySchema.safeParse(
      activitySearchParams({ subjectType: ["A", "B"] }),
    ).success).toBe(false);
    expect(activitySearchParams({actorUserId:"",from:"",subjectType:""})).toEqual({});
  });
  it("preserves filters when navigating to the next cursor", () => {
    const href = collegeActivityHref({ q:"room updated", module: "ACADEMICS", importance: "HIGH",
      eventType: "academics.program.updated", actorUserId: uuid, subjectType: "section", subjectId: uuid }, {
      beforeOccurredAt: new Date("2026-10-14T12:00:00Z"), beforeId: uuid,
    });
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/college/activity");
    expect(url.searchParams.get("q")).toBe("room updated");
    expect(url.searchParams.get("module")).toBe("ACADEMICS");
    expect(url.searchParams.get("importance")).toBe("HIGH");
    expect(url.searchParams.get("eventType")).toBe("academics.program.updated");
    expect(url.searchParams.get("actorUserId")).toBe(uuid);
    expect(url.searchParams.get("beforeId")).toBe(uuid);
    expect(url.searchParams.get("subjectId")).toBe(uuid);
    expect(url.searchParams.has("collegeId")).toBe(false);
  });
});
