import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  collegeProjectSummaryPatch,
  collegeProjectSummaryMatchesCurrent,
  collegeProjectStatusChangeAllowed,
} from "@/modules/projects/college-project-summary-model";

const projectId = "11111111-1111-4111-8111-111111111111";
const expectedUpdatedAt = "2026-10-18T12:00:00.000+05:30";
const original = {
  title: "IIT Dharwad capstone",
  summary: "Build a scoped project",
  status: "ACTIVE" as const,
  progressPercent: 50,
  phase: "Implementation",
  dueLabel: "18 Oct",
  courseLabel: "CS101",
  sectionId: projectId,
  blocker: null,
  nextAction: "Deliver",
  startDate: "2026-10-01",
  endDate: "2026-11-01",
  sprintLengthWeeks: 2,
  estimationUnit: "POINTS" as const,
};
const body = {
  ...original,
  expectedTitle: original.title,
  expectedSummary: original.summary,
  expectedStatus: original.status,
  expectedUpdatedAt,
};
const service = () =>
  readFileSync("src/modules/projects/college-project-summary-service.ts", "utf8");

describe("College Admin Projects summary break-it journeys", () => {
  it("PROJ-BREAK-COL-RETRY-01 idempotent identical retry does not require a stale timestamp to mutate", () => {
    const desired = collegeProjectSummaryPatch.parse(body);
    expect(collegeProjectSummaryMatchesCurrent(original, desired)).toBe(true);
    const source = service();
    const noOp = source.indexOf("if(collegeProjectSummaryMatchesCurrent(row,input))return row;");
    const stale = source.indexOf('throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT")');
    const lock = source.indexOf('for("update")');
    const archive = source.indexOf('row.status==="ARCHIVED"');
    const audit = source.indexOf("recordActivityEventInTransaction(tx,context");
    expect(lock).toBeGreaterThan(-1);
    expect(archive).toBeGreaterThan(lock);
    expect(noOp).toBeGreaterThan(archive);
    expect(stale).toBeGreaterThan(noOp);
    expect(audit).toBeGreaterThan(stale);
    expect(source).toContain("getDb().transaction(async tx=>");
  });

  it("PROJ-BREAK-COL-STALE-01 a stale tab with ANY different desired field must take the CAS conflict path", () => {
    const desired = collegeProjectSummaryPatch.parse(body);
    for (const [field, changed] of Object.entries({
      title: "Another title",
      summary: "Another summary",
      status: "COMPLETED",
      progressPercent: 51,
      phase: "Review",
      dueLabel: "Tomorrow",
      courseLabel: "CS102",
      sectionId: null,
      blocker: "Cannot build",
      nextAction: null,
      startDate: "2026-10-02",
      endDate: "2026-10-31",
      sprintLengthWeeks: 3,
      estimationUnit: "HOURS",
    })) {
      expect(
        collegeProjectSummaryMatchesCurrent(
          { ...original, [field]: changed },
          desired,
        ),
        field,
      ).toBe(false);
    }
  });

  it("PROJ-BREAK-COL-STALE-02 accepts same instant with non-Z timezone only for exact CAS version", () => {
    const source = service();
    expect(source).toContain("row.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt)");
    const utc = "2026-10-18T06:30:00.000Z";
    const ist = "2026-10-18T12:00:00.000+05:30";
    const stale = "2026-10-18T12:00:00.001+05:30";
    expect(Date.parse(utc)).toBe(Date.parse(ist));
    expect(Date.parse(utc)).not.toBe(Date.parse(stale));
    expect(collegeProjectSummaryPatch.safeParse({ ...body, expectedUpdatedAt: ist }).success).toBe(true);
  });

  it("PROJ-BREAK-COL-INPUT-01 rejects bad types, reversed deadlines, unknown keys and fabricated status", () => {
    expect(collegeProjectSummaryPatch.safeParse(body).success).toBe(true);
    for (const invalid of [
      { title: " " }, { progressPercent: -1 }, { progressPercent: 101 },
      { progressPercent: 49.3 }, { status: "ARCHIVED" },
      { startDate: "2026-11-02", endDate: "2026-11-01" },
      { expectedUpdatedAt: "yesterday" },
      { sectionId: "other-college" }, { injectedCollegeId: projectId },
    ]) {
      expect(collegeProjectSummaryPatch.safeParse({ ...body, ...invalid }).success, JSON.stringify(invalid)).toBe(false);
    }
  });

  it("PROJ-BREAK-COL-STATE-01 never allows a stale completion or reopening without required evidence", () => {
    expect(collegeProjectStatusChangeAllowed("PLANNED", "ACTIVE", false, false)).toBe(false);
    expect(collegeProjectStatusChangeAllowed("PLANNED", "ACTIVE", true, false)).toBe(true);
    expect(collegeProjectStatusChangeAllowed("ACTIVE", "COMPLETED", true, false)).toBe(false);
    expect(collegeProjectStatusChangeAllowed("ACTIVE", "COMPLETED", true, true)).toBe(true);
    for (const state of ["ARCHIVED", "UNKNOWN", "CANCELLED"]) {
      expect(collegeProjectStatusChangeAllowed(state, state, true, true)).toBe(false);
      expect(collegeProjectStatusChangeAllowed(state, "ACTIVE", true, true)).toBe(false);
    }
    expect(collegeProjectStatusChangeAllowed("COMPLETED", "ACTIVE", true, true)).toBe(false);
  });

  it("PROJ-BREAK-COL-TENANT-01 summary write keeps project and section inside persisted college", () => {
    const source = service();
    expect(source).toContain("requireProjectManageAccess(context,resolvedId)");
    expect(source).toContain('assertPersistedPlatformPermission(tx,context,"projects.manage"');
    expect(source).toContain("eq(projectInstances.collegeId,scope.collegeId)");
    expect(source).toContain("eq(departments.collegeId,scope.collegeId)");
    expect(source).toContain("recordActivityEventInTransaction(tx,context");
    expect(source).toContain("notifyActiveProjectMembers(tx,updatedEvent.id");
    expect(source).toContain("PROJECT_ACCESS_DENIED");
  });
});
