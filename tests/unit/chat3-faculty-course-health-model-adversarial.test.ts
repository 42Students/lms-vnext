import { describe, expect, it } from "vitest";
import {
  facultyCourseHealthHref, facultyCourseHealthParamsSchema, responseCoverage,
  selectFacultyCourseHealthCandidates,
  type FacultyCourseHealthCandidate,
} from "@/modules/courses/faculty-course-health-model";

const delivery = "11111111-1111-4111-8111-111111111111";
const foreign = "22222222-2222-4222-8222-222222222222";
type Candidate = FacultyCourseHealthCandidate & { privateTag: string };
const candidate = (
  id: string, kind: Candidate["kind"], status: string, deliveryId = delivery,
  dueAt: Date | null = new Date("2099-12-31T18:30:00.000Z"),
): Candidate => ({ id, kind, status, deliveryId, dueAt, title: id, privateTag: "scope-checked" });

describe("FAC-HEALTH-MODEL-01 faculty assessments health boundaries", () => {
  it("strictly parses own delivery, assessment filter and bounded page without extra tenant selectors", () => {
    expect(facultyCourseHealthParamsSchema.parse({ deliveryId: delivery })).toEqual({
      deliveryId: delivery, kind: "ALL", page: 1,
    });
    for (const raw of [
      { deliveryId: "not-a-uuid" },
      { deliveryId: delivery, page: 0 },
      { deliveryId: delivery, page: 10001 },
      { deliveryId: delivery, page: "Infinity" },
      { deliveryId: delivery, page: "1.5" },
      { deliveryId: delivery, kind: "ALL", collegeId: foreign },
      { deliveryId: delivery, kind: "MENTOR" },
    ]) {
      expect(facultyCourseHealthParamsSchema.safeParse(raw).success).toBe(false);
    }
  });

  it("keeps foreign delivery, draft and archived assessments out of count and five-row page", () => {
    const rows = [
      candidate("foreign", "QUIZ", "PUBLISHED", foreign),
      candidate("draft", "QUIZ", "DRAFT"),
      candidate("archive", "ASSIGNMENT", "ARCHIVED"),
      candidate("closed-assignment", "ASSIGNMENT", "CLOSED"),
      candidate("a", "ASSIGNMENT", "PUBLISHED", delivery, new Date("2099-01-01T00:00:00Z")),
      candidate("b", "QUIZ", "CLOSED", delivery, new Date("2099-02-01T00:00:00Z")),
      candidate("c", "QUIZ", "PUBLISHED", delivery, new Date("2099-03-01T00:00:00Z")),
      candidate("d", "ASSIGNMENT", "PUBLISHED", delivery, new Date("2099-04-01T00:00:00Z")),
      candidate("e", "QUIZ", "PUBLISHED", delivery, new Date("2099-05-01T00:00:00Z")),
      candidate("f", "ASSIGNMENT", "PUBLISHED", delivery, new Date("2099-06-01T00:00:00Z")),
    ];
    const snapshot = [...rows];
    const query = facultyCourseHealthParamsSchema.parse({ deliveryId: delivery });
    expect(selectFacultyCourseHealthCandidates(rows, query)).toMatchObject({
      total: 6, page: 1, pageSize: 5, totalPages: 2,
      items: [{ id: "f" }, { id: "e" }, { id: "d" }, { id: "c" }, { id: "b" }],
    });
    expect(selectFacultyCourseHealthCandidates(rows, { ...query, page: 2 }).items).toEqual([rows[4]]);
    expect(selectFacultyCourseHealthCandidates(rows, { ...query, page: 999 }).page).toBe(2);
    expect(selectFacultyCourseHealthCandidates(rows, { ...query, kind: "ASSIGNMENT" }).total).toBe(3);
    expect(rows).toEqual(snapshot);
  });

  it("sorts invalid dates deterministically rather than letting NaN hide assessment records", () => {
    const query = facultyCourseHealthParamsSchema.parse({ deliveryId: delivery });
    const rows = [
      candidate("z", "QUIZ", "PUBLISHED", delivery, new Date("invalid")),
      candidate("a", "ASSIGNMENT", "PUBLISHED", delivery, null),
      candidate("c", "QUIZ", "PUBLISHED", delivery, null),
      candidate("top", "QUIZ", "PUBLISHED", delivery, new Date("2099-09-01T00:00:00Z")),
    ];
    expect(selectFacultyCourseHealthCandidates(rows, query).items.map(item => item.id)).toEqual([
      "top", "a", "c", "z",
    ]);
  });

  it("keeps route filters encoded and treats unknown or impossible response metrics as unknown", () => {
    const query = facultyCourseHealthParamsSchema.parse({ deliveryId: delivery, kind: "QUIZ", page: 2 });
    expect(facultyCourseHealthHref(query)).toBe(
      "/teacher/courses/" + delivery + "/assessment-health?kind=QUIZ&page=2",
    );
    expect(responseCoverage(3, 2)).toBe(67);
    expect(responseCoverage(3, 0)).toBe(0);
    expect(responseCoverage(3, 3)).toBe(100);
    for (const [eligible, responded] of [
      [0, 0], [-1, 0], [1, -1], [1, 2], [1.5, 1], [2, Number.NaN], [3, Infinity],
    ]) {
      expect(responseCoverage(eligible, responded)).toBeNull();
    }
  });
});
