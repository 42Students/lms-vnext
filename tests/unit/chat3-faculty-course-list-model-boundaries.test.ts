import { describe, expect, it } from "vitest";
import {
  FACULTY_COURSE_LIST_PAGE_SIZE, facultyCourseListHref,
  facultyCourseListQuerySchema, facultyCourseWorkspaceRevokedError,
  pageFacultyCourseList, parseFacultyCourseListLocation,
} from "@/modules/courses/faculty-course-list-model";
import { CoursesServiceError } from "@/modules/courses/errors";

const termA = "11111111-1111-4111-8111-111111111111";
const termB = "22222222-2222-4222-8222-222222222222";
const sectionA = "33333333-3333-4333-8333-333333333333";
const sectionB = "44444444-4444-4444-8444-444444444444";
const row = (id: number, options: {
  academicPeriodId?: string; sectionId?: string; teachingRole?: string;
} = {}) => ({
  courseName: "Algorithms " + id,
  courseCode: "CS" + id,
  sectionName: "Section " + id,
  sectionCode: "S" + id,
  academicPeriodId: options.academicPeriodId ?? termA,
  academicPeriodName: "Semester 1",
  teachingRole: options.teachingRole ?? "PRIMARY",
  sectionId: options.sectionId ?? sectionA,
});

describe("FAC-COURSE-LIST-MODEL-01 persisted Faculty delivery projection", () => {
  it("rejects cross-tenant selectors, arrays, malformed pages and unsupported teaching roles", () => {
    for (const raw of [
      { q: "a", collegeId: termA },
      { period: ["", termA] },
      { section: "not-a-uuid" },
      { role: "MENTOR" },
      { page: "1e3" },
      { page: "0001" },
      { page: "-1" },
      { page: "0" },
      { page: 10001 },
      { page: "Infinity" },
      { q: "z".repeat(121) },
    ]) {
      expect(parseFacultyCourseListLocation(raw)).toBeNull();
      expect(facultyCourseListQuerySchema.safeParse(raw).success).toBe(false);
    }
  });

  it("pages only the already-authorized set, preserves caller rows and keeps a stale page recoverable", () => {
    const data = Array.from({ length: 100 }, (_, index) => row(index));
    const snapshot = [...data];
    const query = facultyCourseListQuerySchema.parse({});
    const first = pageFacultyCourseList(data, query);
    expect(first).toMatchObject({ total: 100, page: 1, totalPages: 3, pageSize: 48 });
    expect(first.items).toHaveLength(FACULTY_COURSE_LIST_PAGE_SIZE);
    const last = pageFacultyCourseList(data, { ...query, page: 9999 });
    expect(last.page).toBe(3);
    expect(last.items).toHaveLength(4);
    expect(data).toEqual(snapshot);
  });

  it("intersects assigned period, actual Section ID, teaching role and course search without broadening access", () => {
    const data = [
      row(0), row(1, { academicPeriodId: termB }),
      row(2, { sectionId: sectionB }), row(3, { teachingRole: "ASSISTANT" }),
    ];
    const query = facultyCourseListQuerySchema.parse({
      period: termA, section: sectionA, role: "PRIMARY", q: "CS0",
    });
    expect(pageFacultyCourseList(data, query).items).toEqual([data[0]]);
    expect(pageFacultyCourseList(data, { ...query, q: "impossible" }).items).toEqual([]);
    expect(pageFacultyCourseList([], query)).toMatchObject({
      total: 0, totalPages: 1, page: 1, items: [],
    });
  });

  it("serializes only approved filters with encoded text and never an injected college override", () => {
    const query = facultyCourseListQuerySchema.parse({
      q: "  Section A&B  ", period: termA, section: sectionA, page: "3",
    });
    expect(query.q).toBe("Section A&B");
    const href = facultyCourseListHref(query);
    const path = new URL(href, "https://example.org");
    expect(path.pathname).toBe("/teacher/courses");
    expect(path.searchParams.get("q")).toBe("Section A&B");
    expect(path.searchParams.get("page")).toBe("3");
    expect(path.searchParams.get("period")).toBe(termA);
    expect(path.searchParams.get("section")).toBe(sectionA);
    expect(path.searchParams.has("collegeId")).toBe(false);
  });

  it("suppresses only known revoked teaching workspace errors, not database or unexpected failures", () => {
    for (const code of [
      "FACULTY_TEACHING_SCOPE_REQUIRED", "SECTION_DELIVERY_NOT_FOUND",
      "OFFERING_NOT_FOUND", "LEARNING_ACCESS_DENIED",
    ] as const) {
      expect(facultyCourseWorkspaceRevokedError(new CoursesServiceError(code))).toBe(true);
    }
    expect(facultyCourseWorkspaceRevokedError(new Error("database unavailable"))).toBe(false);
    expect(facultyCourseWorkspaceRevokedError(null)).toBe(false);
  });
});
