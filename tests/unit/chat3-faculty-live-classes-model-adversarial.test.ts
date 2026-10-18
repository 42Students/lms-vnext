import { describe, expect, it } from "vitest";
import {
  facultyLiveClassesHref, facultyLiveClassesQuerySchema,
  mapFacultyLiveWorkspacesInBatches, pageFacultyLiveClasses, safeHttpsMeetingLink,
  type FacultyLiveClass,
} from "@/modules/courses/faculty-live-classes-model";
const deliveryA = "11111111-1111-4111-8111-111111111111";
const deliveryB = "22222222-2222-4222-8222-222222222222";
const now = new Date("2099-06-01T12:00:00.000Z");
function meeting(id: string, endsAt: string, deliveryId = deliveryA): FacultyLiveClass {
  return {
    id, deliveryId, courseName: "Algorithms", sectionName: "A", title: id,
    status: "SCHEDULED", joinUrl: "https://meet.example.org/" + id,
    startsAt: new Date("2099-06-01T09:00:00Z"), endsAt: new Date(endsAt),
  };
}

describe("FAC-LIVE-MODEL-01 class session, URL and workload resilience", () => {
  it("rejects injected college IDs and unsupported view parameters", () => {
    for (const raw of [
      { collegeId: deliveryB }, { deliveryId: ["one", "two"] },
      { deliveryId: "invalid" }, { view: "LIVE" },
      { view: "ALL", page: -1 }, { view: "ALL", page: "Infinity" },
    ]) {
      expect(facultyLiveClassesQuerySchema.safeParse(raw).success).toBe(false);
    }
    expect(facultyLiveClassesQuerySchema.parse({})).toEqual({ view: "UPCOMING", page: 1 });
  });

  it("views only already-authorized delivery meetings; marks the exact end boundary as upcoming", () => {
    const rows = [
      meeting("ended", "2099-06-01T11:59:59.999Z"),
      meeting("boundary", "2099-06-01T12:00:00.000Z"),
      meeting("future", "2099-06-01T13:00:00.000Z"),
      meeting("foreign", "2099-06-01T13:00:00.000Z", deliveryB),
    ];
    const query = facultyLiveClassesQuerySchema.parse({ deliveryId: deliveryA });
    expect(pageFacultyLiveClasses(rows, query, now).items.map(row => row.id))
      .toEqual(["boundary", "future"]);
    expect(pageFacultyLiveClasses(rows, { ...query, view: "PAST" }, now).items.map(row => row.id))
      .toEqual(["ended"]);
    expect(pageFacultyLiveClasses(rows, { ...query, view: "ALL" }, now).total).toBe(3);
    expect(rows.map(row => row.id)).toEqual(["ended", "boundary", "future", "foreign"]);
  });

  it("paginates twenty-row lists and sorts equal and malformed timestamps deterministically", () => {
    const rows = [
      ...Array.from({ length: 40 }, (_, index) =>
        meeting("id-" + String(index).padStart(2, "0"), "2099-06-01T13:00:00.000Z")),
      meeting("bad", "2099-06-01T13:00:00.000Z"),
    ];
    rows[0] = { ...rows[0]!, startsAt: new Date("invalid") };
    const query = facultyLiveClassesQuerySchema.parse({ view: "ALL", page: 99 });
    expect(pageFacultyLiveClasses(rows, query, now)).toMatchObject({
      total: 41, totalPages: 3, page: 3,
    });
    expect(pageFacultyLiveClasses(rows, query, now).items).toHaveLength(1);
    expect(pageFacultyLiveClasses(rows, { ...query, page: 1 }, now).items[0]?.id).toBe("id-00");
  });

  it("rejects credential-bearing, localhost or non-HTTPS joining links", () => {
    for (const value of [
      null, undefined, "", "http://meet.example.org", "javascript:alert(1)",
      "https://user:pass@meet.example.org", "https://localhost/session",
      "https://class.localhost/one", "bad-url",
    ]) {
      expect(safeHttpsMeetingLink(value)).toBeNull();
    }
    expect(safeHttpsMeetingLink(" https://meet.example.org/class?x=1 ")).toBe(
      "https://meet.example.org/class?x=1",
    );
  });

  it("round-trips scoped search URL and omits default filters", () => {
    expect(facultyLiveClassesHref(facultyLiveClassesQuerySchema.parse({})))
      .toBe("/teacher/live-classes");
    const query = facultyLiveClassesQuerySchema.parse({ view: "PAST", deliveryId: deliveryB, page: 3 });
    const url = new URL(facultyLiveClassesHref(query), "https://example.org");
    expect(url.searchParams.get("deliveryId")).toBe(deliveryB);
    expect(url.searchParams.get("view")).toBe("PAST");
    expect(url.searchParams.get("page")).toBe("3");
  });

  it("keeps no more than eight workspace operations in flight and preserves input order", async () => {
    const values = Array.from({ length: 19 }, (_, index) => index);
    let active = 0;
    let peak = 0;
    const result = await mapFacultyLiveWorkspacesInBatches(values, async value => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      return value * 2;
    }, 8);
    expect(result).toEqual(values.map(value => value * 2));
    expect(peak).toBe(8);
    for (const invalid of [0, 9, -1, Number.NaN, 1.5]) {
      await expect(mapFacultyLiveWorkspacesInBatches([1], async x => x, invalid))
        .rejects.toThrow("INVALID_FACULTY_LIVE_WORKSPACE_CONCURRENCY");
    }
  });
});
