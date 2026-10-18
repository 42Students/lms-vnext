import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({
  roster: vi.fn(),
  overview: vi.fn(),
  assignment: vi.fn(),
  quiz: vi.fn(),
}));
vi.mock("@/modules/attendance/faculty-service", () => ({
  getFacultyDeliveryRoster: stubs.roster,
}));
vi.mock("@/modules/courses/faculty-assessment-service", () => ({
  getFacultyAssessmentOverview: stubs.overview,
}));
vi.mock("@/modules/courses/faculty-assessment-report-service", () => ({
  getFacultyAssignmentReport: stubs.assignment,
  getFacultyQuizReport: stubs.quiz,
}));
import { getFacultyCourseAssessmentHealth } from "@/modules/courses/faculty-course-health-service";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const foreignDelivery = "22222222-2222-4222-8222-222222222222";
const due = new Date("2099-02-01T00:00:00.000Z");
const wrongDate = new Date("2099-01-01T00:00:00.000Z");
function actor(role: MembershipRole = "FACULTY"): RequestContext {
  return {
    user: { id: "teacher", identityUid: "teacher", platformStatus: "ACTIVE", systemRoles: [] },
    membership: {
      id: "faculty-membership", collegeId: "college", organizationId: "org",
      status: "ACTIVE", roles: [role],
    },
  };
}
const row = (id: string, kind: "QUIZ" | "ASSIGNMENT", options: {
  deliveryId?: string; status?: string; dueAt?: Date | null,
} = {}) => ({
  id, deliveryId: options.deliveryId ?? deliveryId, title: id,
  status: options.status ?? "PUBLISHED",
  dueAt: options.dueAt === undefined ? due : options.dueAt,
  kind,
});
beforeEach(() => {
  vi.resetAllMocks();
  stubs.roster.mockResolvedValue({
    delivery: { id: deliveryId }, roster: [{ membershipId: "a" }, { membershipId: "b" }],
  });
  stubs.overview.mockResolvedValue({
    assignments: [row("assignment1", "ASSIGNMENT"),
      row("privateDraft", "ASSIGNMENT", { status: "DRAFT" }),
      row("foreign", "ASSIGNMENT", { deliveryId: foreignDelivery })],
    quizzes: [row("quiz1", "QUIZ", { dueAt: wrongDate, status: "CLOSED" })],
  });
  stubs.assignment.mockResolvedValue({
    metrics: { eligibleLearners: 2, submitted: 1, missing: 1, graded: 1, averagePercent: 75 },
  });
  stubs.quiz.mockResolvedValue({
    metrics: { eligibleLearners: 2, submittedLearners: 2, notAttempted: 0, graded: 2, averagePercent: 90 },
  });
});

describe("FAC-HEALTH-SERVICE-01 Faculty assessment health scope", () => {
  it("refuses Mentor, Learner, College Admin, missing and suspended memberships before reading reports", async () => {
    const blocked: RequestContext[] = [
      actor("MENTOR"), actor("LEARNER"), actor("COLLEGE_ADMIN"),
      { ...actor(), membership: null },
      { ...actor(), membership: { ...actor().membership!, status: "SUSPENDED" } },
      { ...actor(), user: { ...actor().user, platformStatus: "DISABLED" } },
    ];
    for (const context of blocked) {
      await expect(getFacultyCourseAssessmentHealth(context, { deliveryId }))
        .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    }
    expect(stubs.roster).not.toHaveBeenCalled();
    expect(stubs.assignment).not.toHaveBeenCalled();
    expect(stubs.quiz).not.toHaveBeenCalled();
  });

  it("rejects forged query shape and invalid Section UUID before any datastore access", async () => {
    for (const query of [
      { deliveryId: "invalid" }, { deliveryId, role: "SUPER_ADMIN" },
      { deliveryId, collegeId: foreignDelivery }, { deliveryId, page: -1 },
      { deliveryId, kind: "FINAL" },
    ]) {
      await expect(getFacultyCourseAssessmentHealth(actor(), query)).rejects.toThrow();
    }
    expect(stubs.roster).not.toHaveBeenCalled();
  });

  it("only expands published own-delivery assessments and preserves their actual metrics", async () => {
    const report = await getFacultyCourseAssessmentHealth(actor(), { deliveryId });
    expect(report.rosterSize).toBe(2);
    expect(report.total).toBe(2);
    expect(report.items.map(item => item.id)).toEqual(["assignment1", "quiz1"]);
    expect(report.items[0]).toMatchObject({
      responded: 1, eligible: 2, outstanding: 1, graded: 1,
      averagePercent: 75, coveragePercent: 50,
    });
    expect(report.items[1]).toMatchObject({
      responded: 2, eligible: 2, outstanding: 0,
      averagePercent: 90, coveragePercent: 100,
    });
    expect(JSON.stringify(report)).not.toContain("foreign");
    expect(JSON.stringify(report)).not.toContain("privateDraft");
  });

  it("restricts each report call to exact deliveryId without trusting a sibling assessment", async () => {
    await getFacultyCourseAssessmentHealth(actor(), { deliveryId, kind: "QUIZ" });
    expect(stubs.assignment).not.toHaveBeenCalled();
    expect(stubs.quiz).toHaveBeenCalledOnce();
    expect(stubs.quiz).toHaveBeenCalledWith(expect.anything(), "quiz1", deliveryId);
  });

  it("caps expanded reads to five per page, clamps stale page links and never fakes missing reports", async () => {
    stubs.overview.mockResolvedValue({
      assignments: Array.from({ length: 12 }, (_, i) =>
        row("a" + i, "ASSIGNMENT", { dueAt: due })),
      quizzes: [],
    });
    const first = await getFacultyCourseAssessmentHealth(actor(), { deliveryId, page: 1 });
    expect(first.items).toHaveLength(5);
    expect(stubs.assignment).toHaveBeenCalledTimes(5);
    stubs.assignment.mockClear();
    const last = await getFacultyCourseAssessmentHealth(actor(), { deliveryId, page: 999 });
    expect(last.page).toBe(3);
    expect(last.items).toHaveLength(2);
    expect(stubs.assignment).toHaveBeenCalledTimes(2);
  });

  it("preserves permission errors from a newly revoked teaching grant rather than announcing fabricated zeroes", async () => {
    stubs.assignment.mockRejectedValueOnce(new Error("revoked"));
    await expect(getFacultyCourseAssessmentHealth(actor(), { deliveryId }))
      .rejects.toThrow("revoked");
    expect(stubs.quiz).toHaveBeenCalledOnce();
  });
});
