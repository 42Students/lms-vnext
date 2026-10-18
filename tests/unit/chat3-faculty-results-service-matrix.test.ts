import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({
  overview: vi.fn(),
  assignment: vi.fn(),
  quiz: vi.fn(),
}));
vi.mock("@/modules/courses/faculty-assessment-service", () => ({
  getFacultyAssessmentOverview: stubs.overview,
}));
vi.mock("@/modules/courses/faculty-assessment-report-service", () => ({
  getFacultyAssignmentReport: stubs.assignment,
  getFacultyQuizReport: stubs.quiz,
}));

import { getFacultyAssessmentResults } from "@/modules/courses/faculty-results-service";

const own = "11111111-1111-4111-8111-111111111111";
const foreign = "22222222-2222-4222-8222-222222222222";
const due = new Date("2099-10-20T12:00:00.000Z");

function actor(role: MembershipRole = "FACULTY"): RequestContext {
  return {
    user: {
      id: "active-faculty",
      identityUid: "teaching-identity",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: "faculty-membership",
      organizationId: "organization-a",
      collegeId: "college-a",
      status: "ACTIVE",
      roles: [role],
    },
  };
}
const assignment = (index: number, deliveryId = own) => ({
  id: "assignment-" + index,
  kind: "ASSIGNMENT" as const,
  status: "PUBLISHED",
  title: "Assignment " + index,
  deliveryId,
  courseName: "Algorithms",
  sectionName: "A",
  courseCode: "CSE101",
  sectionCode: "A",
  dueAt: due,
});
const quiz = (index: number, deliveryId = own) => ({
  ...assignment(index, deliveryId),
  id: "quiz-" + index,
  kind: "QUIZ" as const,
  title: "Quiz " + index,
  status: "CLOSED",
});

beforeEach(() => {
  vi.resetAllMocks();
  stubs.overview.mockResolvedValue({
    courses: [{ deliveryId: own }],
    assignments: [assignment(1), assignment(2)],
    quizzes: [quiz(1)],
  });
  stubs.assignment.mockResolvedValue({
    metrics: {
      eligibleLearners: 20,
      submitted: 12,
      missing: 8,
      averagePercent: 75,
      gradePublished: 10,
    },
  });
  stubs.quiz.mockResolvedValue({
    metrics: {
      eligibleLearners: 20,
      submittedLearners: 18,
      notAttempted: 2,
      averagePercent: 85,
    },
  });
});

describe("FAC-RESULTS-SERVICE-01 Faculty results permission and pagination", () => {
  it("rejects Mentor, Learner, College Admin, disabled and suspended Faculty before assessment reads", async () => {
    const base = actor();
    const forbidden: RequestContext[] = [
      actor("MENTOR"),
      actor("LEARNER"),
      actor("COLLEGE_ADMIN"),
      { ...base, user: { ...base.user, platformStatus: "DISABLED" } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" } },
      { ...base, membership: null },
    ];
    for (const principal of forbidden) {
      await expect(getFacultyAssessmentResults(principal, {}))
        .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    }
    expect(stubs.overview).not.toHaveBeenCalled();
    expect(stubs.assignment).not.toHaveBeenCalled();
    expect(stubs.quiz).not.toHaveBeenCalled();
  });

  it("rejects injected or malformed paging selectors before touching teaching records", async () => {
    for (const input of [
      { collegeId: foreign },
      { deliveryId: "not-a-uuid" },
      { page: -1 },
      { pageSize: 500 },
      { sort: "SQL" },
      { kind: "ALL", search: "x".repeat(121) },
    ]) {
      await expect(getFacultyAssessmentResults(actor(), input)).rejects.toThrow();
    }
    expect(stubs.overview).not.toHaveBeenCalled();
  });

  it("refuses to expand a forged Section outside the current teaching assignments", async () => {
    await expect(getFacultyAssessmentResults(actor(), { deliveryId: foreign }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    expect(stubs.overview).toHaveBeenCalledOnce();
    expect(stubs.assignment).not.toHaveBeenCalled();
    expect(stubs.quiz).not.toHaveBeenCalled();
  });

  it("maps real assignment and quiz report metrics without merging one learner's scores into another Section", async () => {
    const result = await getFacultyAssessmentResults(actor(), {
      deliveryId: own,
      status: "PUBLISHED",
    });
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(3);
    const itemsById = new Map(result.items.map(item => [item.id, item]));
    expect(itemsById.get("assignment-1")).toMatchObject({
      eligible: 20, responded: 12, pending: 8, averagePercent: 75, published: 10,
    });
    expect(itemsById.get("quiz-1")).toMatchObject({
      eligible: 20, responded: 18, pending: 2, averagePercent: 85, published: null,
    });
    expect(itemsById.get("quiz-1")?.reportHref)
      .toBe("/teacher/report/quiz/quiz-1?deliveryId=" + own);
    expect(stubs.assignment).toHaveBeenCalledWith(expect.anything(), "assignment-1", own);
    expect(stubs.quiz).toHaveBeenCalledWith(expect.anything(), "quiz-1", own);
  });

  it("expands only the five selected rows, with page clamp and no premature off-page reporting", async () => {
    stubs.overview.mockResolvedValue({
      courses: [{ deliveryId: own }],
      assignments: Array.from({ length: 12 }, (_, i) => assignment(i)),
      quizzes: [],
    });
    const result = await getFacultyAssessmentResults(actor(), { page: 999 });
    expect(result).toMatchObject({ total: 12, totalPages: 3, page: 3 });
    expect(result.items).toHaveLength(2);
    expect(stubs.assignment).toHaveBeenCalledTimes(2);
    expect(stubs.quiz).not.toHaveBeenCalled();
  });

  it("propagates revoked persisted teaching rights instead of fabricating empty results", async () => {
    stubs.assignment.mockRejectedValueOnce(new Error("current teaching grant revoked"));
    await expect(getFacultyAssessmentResults(actor(), {}))
      .rejects.toThrow("current teaching grant revoked");
  });
});
