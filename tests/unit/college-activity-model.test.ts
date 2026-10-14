import { describe, expect, it } from "vitest";
import { activitySearchParams, collegeActivityHref, collegeActivityQuerySchema, collegeActivityRecentHref } from "@/modules/activity/college-activity-model";

const uuid = "10000000-0000-4000-8000-000000000001";
describe("College activity model", () => {
  it("strictly accepts actor, entity and date filters", () => {
    expect(collegeActivityQuerySchema.parse({
      module: "ACADEMICS", importance: "HIGH", eventType: "academics.program.updated",
      actorUserId: uuid, subjectType: "course_lesson", subjectId: uuid,
      from: "2026-10-01", to: "2026-10-14",
    })).toMatchObject({ actorUserId: uuid, subjectType: "course_lesson" });
    for (const query of [
      { actorName: "x".repeat(101) }, { q: "x".repeat(101) }, { collegeId: uuid }, { module: "FOREIGN" }, { importance: "IMPORTANT" },
      { eventType: "x".repeat(121) }, { from: "2026-02-30" }, { from: "2026-10-15", to: "2026-10-14" },
      { beforeId: uuid }, { beforeOccurredAt: "2026-10-14T12:00:00Z" },
      { pageSize:"100" }, {pageSize:"0"}, { actorUserId: "not-a-uuid" }, { subjectId: "x".repeat(501) },
    ]) expect(collegeActivityQuerySchema.safeParse(query).success).toBe(false);
    expect(collegeActivityQuerySchema.parse({subjectId:"  legacy-case:42  "}).subjectId).toBe("legacy-case:42");
    expect(collegeActivityQuerySchema.safeParse(
      activitySearchParams({ subjectType: ["A", "B"] }),
    ).success).toBe(false);
    expect(activitySearchParams({actorUserId:"",from:"",subjectType:""})).toEqual({});
  });
  it("constructs exact IST calendar shortcuts and preserves non-date filters without cursor", () => {
    const filter = {module:"ACADEMICS" as const, q:"first term",
      beforeOccurredAt:"2026-10-14T12:00:00Z",beforeId:uuid};
    const date=new Date("2026-10-14T20:00:00Z"); // 15 Oct in Asia/Kolkata
    const seven=new URL(collegeActivityRecentHref(filter,7,date),"https://example.test");
    const thirty=new URL(collegeActivityRecentHref(filter,30,date),"https://example.test");
    expect(seven.searchParams.get("from")).toBe("2026-10-09");
    expect(seven.searchParams.get("to")).toBe("2026-10-15");
    expect(thirty.searchParams.get("from")).toBe("2026-09-16");
    expect(seven.searchParams.get("module")).toBe("ACADEMICS");
    expect(seven.searchParams.get("q")).toBe("first term");
    expect(seven.searchParams.has("beforeId")).toBe(false);
    expect(collegeActivityQuerySchema.safeParse(Object.fromEntries(seven.searchParams)).success).toBe(true);
    const yearBoundary=new URL(collegeActivityRecentHref({},7,new Date("2027-01-01T00:00:00Z")),"https://example.test");
    expect(yearBoundary.searchParams.get("from")).toBe("2026-12-26");
    expect(() => collegeActivityRecentHref({},7,new Date("invalid"))).toThrow("INVALID_DATE");
  });
  it("persists bounded per-page size in cursor URLs without accepting oversized reads",()=>{
    expect(collegeActivityQuerySchema.parse({pageSize:"10"}).pageSize).toBe("10");
    expect(collegeActivityQuerySchema.parse({pageSize:"50"}).pageSize).toBe("50");
    const url=new URL(collegeActivityHref({pageSize:"50"},{
      beforeOccurredAt:new Date("2026-10-14T12:00:00Z"),beforeId:uuid,
    }),"https://example.test");
    expect(url.searchParams.get("pageSize")).toBe("50");
    expect(url.searchParams.get("beforeId")).toBe(uuid);
    expect(new URL(collegeActivityHref({pageSize:"25"}),"https://example.test").searchParams.has("pageSize")).toBe(false);
  });
  it("preserves filters when navigating to the next cursor", () => {
    const href = collegeActivityHref({ actorName:"Ana", q:"room updated", module: "ACADEMICS", importance: "HIGH",
      eventType: "academics.program.updated", actorUserId: uuid, subjectType: "section", subjectId: uuid }, {
      beforeOccurredAt: new Date("2026-10-14T12:00:00Z"), beforeId: uuid,
    });
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/college/activity");
    expect(url.searchParams.get("actorName")).toBe("Ana");
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
