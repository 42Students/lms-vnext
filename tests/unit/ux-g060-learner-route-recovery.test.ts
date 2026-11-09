import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { learnerAssignmentsLegacyAliasHref } from "@/modules/courses/learner-assignment-page-model";
import { learnerAttendanceCalendarQuerySchema } from "@/modules/attendance/learner-attendance-calendar-model";

const deliveryId = "81818181-8181-4818-8818-818181818181";
const courseId = "83838383-8383-4838-8838-838383838383";
const route = (file: string) =>
  readFileSync(new URL("../../src/app/(authenticated)/learn/" + file, import.meta.url), "utf8");

describe("UX-G060: old learner assignment bookmarks", () => {
  it("preserves valid authorized-course selectors for the canonical route to validate", () => {
    expect(learnerAssignmentsLegacyAliasHref({})).toBe("/learn/allAssignments");
    expect(learnerAssignmentsLegacyAliasHref({ course: courseId }))
      .toBe("/learn/allAssignments?course=" + courseId);
    expect(learnerAssignmentsLegacyAliasHref({ course: courseId, page: "3" }))
      .toBe("/learn/allAssignments?course=" + courseId + "&page=3");
    expect(learnerAssignmentsLegacyAliasHref({ page: "2" }))
      .toBe("/learn/allAssignments?page=2");
  });

  it("refuses ambiguous or malicious aliases instead of changing the course silently", () => {
    for (const query of [
      { course: [courseId, deliveryId] },
      { course: "other-college" },
      { course: "/login?next=//evil.example" },
      { course: "" },
      { page: ["1", "3"] },
      { page: "0" },
      { page: "10001" },
      { page: "1&collegeId=" + deliveryId },
    ]) {
      expect(learnerAssignmentsLegacyAliasHref(query)).toBeNull();
    }
    // Unknown owner/college selectors are never sent to the canonical route.
    expect(learnerAssignmentsLegacyAliasHref({ collegeId: deliveryId, membershipId: courseId }))
      .toBe("/learn/allAssignments");
  });

  it("renders an actionable recovery instead of an unfiltered redirect on a bad alias", () => {
    const source = route("assignments/page.tsx");
    expect(source).toContain("learnerAssignmentsLegacyAliasHref(await searchParams)");
    expect(source).toContain('retryHref="/learn/allAssignments"');
    expect(source).toContain('title="Check your assignment link"');
  });
});

describe("UX-G060: learner calendar and course bookmark recovery", () => {
  it("never treats repeated month, status or delivery selectors as a single attendance filter", () => {
    for (const input of [
      { month: ["2026-10", "2026-11"] },
      { deliveryId: [deliveryId, "ALL"] },
      { status: ["PRESENT", "ABSENT"] },
    ]) {
      expect(learnerAttendanceCalendarQuerySchema.safeParse(input).success).toBe(false);
    }
    const source = route("attendance/calendar/page.tsx");
    expect(source).toContain("month:raw.month??undefined");
    expect(source).toContain("deliveryId:raw.deliveryId??undefined");
    expect(source).toContain("status:raw.status??undefined");
    expect(source).toContain('href="/learn/attendance/calendar"');
  });

  it("provides calendar recovery without weakening scoped course checks", () => {
    const source = route("calendar/page.tsx");
    expect(source).toContain('retryHref="/learn/calendar"');
    expect(source).toContain("getCurrentRequestContext()");
    expect(source).toContain("if (!filters) notFound()");
    expect(source).toContain("getLearnerClassSchedule(context, window)");
    // A transient scoped read failure must not be displayed as a 404 after
    // the fallback course list becomes empty.
    expect(source).toContain("scheduleWarning && validated.data.deliveryId");
    expect(source).toContain("Class schedule temporarily unavailable");
  });

  it("does not silently choose the first of conflicting course/lesson selectors", () => {
    const source = route("courses/[deliveryId]/page.tsx");
    expect(source).toContain("allowed.some(key=>Array.isArray(query[key]))");
    expect(source).toContain('retryHref="/learn/courses"');
    expect(source).toContain('typeof value==="string"?value:undefined');
    expect(source).toContain('redirect("/learn/courses/"+encodeURIComponent(deliveryId)');
  });
});

describe("UX-G060: learner route-state recovery boundaries", () => {
  it("keeps an assignment read failure inside the learner shell with retry and canonical exit", () => {
    const error = route("assignments/error.tsx");
    const loading = route("assignments/loading.tsx");
    expect(error).toContain("Assignments could not be loaded");
    expect(error).toContain("This does not mean you have no assignments");
    expect(error).toContain("onClick={reset}");
    expect(error).toContain('href="/learn/allAssignments"');
    expect(error).not.toContain("GracefulErrorBoundary");
    expect(loading).toContain('label="Loading assignments"');
    expect(loading).toContain('shape="directory"');
  });

  it("keeps attendance failure distinguishable from absence and provides a safe exit", () => {
    const error = route("attendance/calendar/error.tsx");
    const loading = route("attendance/calendar/loading.tsx");
    expect(error).toContain("missing or unmarked sessions cannot be inferred");
    expect(error).toContain("onClick={reset}");
    expect(error).toContain('href="/learn/attendance"');
    expect(loading).toContain('label="Loading attendance calendar"');
  });
});
