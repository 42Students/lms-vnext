import { describe, expect, it } from "vitest";
import { activityQuickHref } from "@/modules/activity/ux-query";

const query = (href: string) => new URL(href, "https://example.test").searchParams;

describe("UX-G004: activity navigation preserves investigation context", () => {
  it("retains advanced filters and college scope while changing category", () => {
    const q = query(activityQuickHref({
      params: {
        module: "PLACEMENTS", importance: "HIGH", actorUserId: "actor-42",
        eventType: "placement.offer.issued", subjectType: "offer",
        subjectId: "record-1", actorName: "Asha", q: "issued",
        collegeId: "college-1", beforeId: "old-cursor", beforeOccurredAt: "2026-11-01",
      },
      view: "people", from: "2026-11-01", to: "2026-11-07",
      range: "7d", rawMode: false, superAdmin: true,
    }));
    expect(q.get("view")).toBe("people");
    expect(q.get("module")).toBe("PLACEMENTS");
    expect(q.get("importance")).toBe("HIGH");
    expect(q.get("actorUserId")).toBe("actor-42");
    expect(q.get("eventType")).toBe("placement.offer.issued");
    expect(q.get("subjectType")).toBe("offer");
    expect(q.get("subjectId")).toBe("record-1");
    expect(q.get("actorName")).toBe("Asha");
    expect(q.get("q")).toBe("issued");
    expect(q.get("collegeId")).toBe("college-1");
    expect(q.get("from")).toBe("2026-11-01");
    expect(q.get("to")).toBe("2026-11-07");
    expect(q.get("range")).toBe("7d");
    expect(q.has("beforeId")).toBe(false);
    expect(q.has("beforeOccurredAt")).toBe(false);
  });

  it("does not propagate elevated search fields or forge college scope for college admins", () => {
    const q = query(activityQuickHref({
      params: { actorName: "private", q: "private", collegeId: "other-college",
        module: "ACADEMICS" },
      view: "all", rawMode: false, superAdmin: false,
    }));
    expect(q.get("module")).toBe("ACADEMICS");
    expect(q.has("actorName")).toBe(false);
    expect(q.has("q")).toBe(false);
    expect(q.has("collegeId")).toBe(false);
  });

  it("honors pinned super-admin college and keeps forensic mode/size", () => {
    const q = query(activityQuickHref({
      params: { collegeId: "forged", size: "100", q: "student" },
      view: "all", rawMode: true, superAdmin: true, pinnedCollegeId: "pinned",
    }));
    expect(q.has("collegeId")).toBe(false);
    expect(q.get("q")).toBe("student");
    expect(q.get("mode")).toBe("raw");
    expect(q.get("size")).toBe("100");
    expect(q.get("range")).toBe("ALL");
  });

  it("drops raw pagination size in grouped feed and changes the date range without old dates", () => {
    const q = query(activityQuickHref({
      params: { size: "100", from: "2020-01-01", to: "2020-01-02", range: "ALL" },
      view: "important", from: "2026-11-07", to: "2026-11-07",
      range: "today", rawMode: false, superAdmin: true,
    }));
    expect(q.has("size")).toBe(false);
    expect(q.get("range")).toBe("today");
    expect(q.get("from")).toBe("2026-11-07");
    expect(q.get("to")).toBe("2026-11-07");
  });
});
