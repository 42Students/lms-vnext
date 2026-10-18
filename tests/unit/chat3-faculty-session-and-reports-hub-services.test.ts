import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({
  workspace: vi.fn(),
  overview: vi.fn(),
  health: vi.fn(),
}));
vi.mock("@/modules/attendance/faculty-service", () => ({
  getFacultyAttendanceWorkspace: stubs.workspace,
}));
vi.mock("@/modules/courses/faculty-assessment-service", () => ({
  getFacultyAssessmentOverview: stubs.overview,
}));
vi.mock("@/modules/courses/faculty-course-health-service", () => ({
  getFacultyCourseAssessmentHealth: stubs.health,
}));
import { getFacultyReportsHub } from "@/modules/courses/faculty-reports-hub-service";
import { getFacultySessionCoverage } from "@/modules/courses/faculty-session-coverage-service";

const own = "11111111-1111-4111-8111-111111111111";
const foreign = "22222222-2222-4222-8222-222222222222";

function actor(): RequestContext {
  return {
    user: { id: "teacher", identityUid: "faculty", platformStatus: "ACTIVE", systemRoles: [] },
    membership: {
      id: "teacher-membership",
      collegeId: "college-a",
      organizationId: "organization-a",
      status: "ACTIVE",
      roles: ["FACULTY"],
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  stubs.workspace.mockResolvedValue({
    course: { deliveryId: own, courseName: "Physics" },
    sessions: [
      { id: "event1", title: "Lecture 1",
        startsAt: new Date("2099-01-01T10:00:00.000Z"),
        endsAt: new Date("2099-01-01T11:00:00.000Z"),
        markedAt: new Date("2099-01-01T11:00:00.000Z"),
        attendanceStatus: "MARKED" },
      { id: "event2", title: "Lecture 2",
        startsAt: new Date("2099-01-02T10:00:00.000Z"),
        endsAt: new Date("2099-01-02T11:00:00.000Z"),
        markedAt: null, attendanceStatus: null },
    ],
  });
  stubs.overview.mockResolvedValue({
    assignments: [
      { deliveryId: own, status: "PUBLISHED" },
      { deliveryId: foreign, status: "PUBLISHED" },
      { deliveryId: own, status: "DRAFT" },
    ],
    quizzes: [
      { deliveryId: own, status: "CLOSED" },
      { deliveryId: own, status: "DRAFT" },
      { deliveryId: foreign, status: "CLOSED" },
    ],
  });
  stubs.health.mockResolvedValue({
    delivery: { id: own },
    rosterSize: 20,
    items: [{ kind: "ASSIGNMENT", id: "assessment-1" }],
  });
});

describe("FAC-REPORTS-HUB-SERVICE-01 currently assigned Section reports", () => {
  it("counts only selected Section assessments and keeps closed quiz reports visible", async () => {
    const result = await getFacultyReportsHub(actor(), { deliveryId: own });
    expect(result.breakdown).toEqual({
      assignments: 2,
      quizzes: 2,
      publishedAssignments: 1,
      publishedQuizzes: 1,
    });
    expect(result.attendance).toEqual({ scheduled: 2, marked: 1 });
    expect(result.rosterSize).toBe(20);
    expect(stubs.health).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      deliveryId: own,
    }));
    expect(stubs.workspace).toHaveBeenCalledWith(expect.anything(), own);
  });

  it("rejects another-role and suspended/disabled principals before returning report data", async () => {
    const base = actor();
    for (const principal of [
      { ...base, membership: { ...base.membership!, roles: ["MENTOR"] as const } },
      { ...base, membership: { ...base.membership!, roles: ["LEARNER"] as const } },
      { ...base, membership: { ...base.membership!, roles: ["COLLEGE_ADMIN"] as const } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" as const } },
      { ...base, user: { ...base.user, platformStatus: "DISABLED" as const } },
      { ...base, membership: null },
    ]) {
      await expect(getFacultyReportsHub(principal, { deliveryId: own }))
        .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    }
    expect(stubs.workspace).not.toHaveBeenCalled();
  });

  it("does not hide a backend teaching-grant refusal behind a fabricated healthy report", async () => {
    stubs.health.mockRejectedValueOnce(new Error("Teaching Section revoked"));
    await expect(getFacultyReportsHub(actor(), { deliveryId: own }))
      .rejects.toThrow("Teaching Section revoked");
  });
});

describe("FAC-SESSION-COVERAGE-SERVICE-01 live attendance reporting", () => {
  it("calculates attendance summaries only for a verified Faculty delivery", async () => {
    const result = await getFacultySessionCoverage(actor(), { deliveryId: own });
    expect(result.total).toBe(2);
    expect(result.marked).toBe(1);
    expect(result.shown).toHaveLength(2);
    expect(result.shown[0]?.id).toBe("event2");
    expect(result.course).toMatchObject({ deliveryId: own });
  });

  it("caps session rows at forty and transparently reports the omitted count", async () => {
    stubs.workspace.mockResolvedValueOnce({
      course: { deliveryId: own },
      sessions: Array.from({ length: 42 }, (_, n) => ({
        id: "event-" + n,
        title: "Class " + n,
        startsAt: new Date("2099-01-01T10:00:00.000Z"),
        endsAt: new Date("2099-01-01T11:00:00.000Z"),
        attendanceStatus: null,
      })),
    });
    const result = await getFacultySessionCoverage(actor(), { deliveryId: own });
    expect(result.total).toBe(42);
    expect(result.shown).toHaveLength(40);
    expect(result.omitted).toBe(2);
  });

  it("refuses malformed paths, injected college IDs and non-Faculty roles before any workspace read", async () => {
    for (const filters of [
      { deliveryId: "not-uuid" },
      { deliveryId: own, collegeId: foreign },
    ]) await expect(getFacultySessionCoverage(actor(), filters)).rejects.toThrow();
    for (const principal of [
      { ...actor(), membership: { ...actor().membership!, roles: ["MENTOR"] as const } },
      { ...actor(), membership: { ...actor().membership!, roles: ["LEARNER"] as const } },
      { ...actor(), user: { ...actor().user, platformStatus: "DISABLED" as const } },
    ]) {
      await expect(getFacultySessionCoverage(principal, { deliveryId: own }))
        .rejects.toThrow("Missing permission: courses.read");
    }
    expect(stubs.workspace).not.toHaveBeenCalled();
  });
});
