import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import type { MembershipRole } from "@/modules/identity/constants";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({
  roster: vi.fn(),
  overview: vi.fn(),
  assignmentReport: vi.fn(),
  quizReport: vi.fn(),
}));
vi.mock("@/modules/attendance/faculty-service", () => ({
  getFacultyDeliveryRoster: stubs.roster,
}));
vi.mock("@/modules/courses/faculty-assessment-service", () => ({
  getFacultyAssessmentOverview: stubs.overview,
}));
vi.mock("@/modules/courses/faculty-assessment-report-service", () => ({
  getFacultyAssignmentReport: stubs.assignmentReport,
  getFacultyQuizReport: stubs.quizReport,
}));
import {
  getFacultyPublishedGradebook,
  getFacultyPublishedGradebookLearner,
} from "@/modules/courses/faculty-gradebook-service";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const learnerA = "22222222-2222-4222-8222-222222222222";
const learnerB = "33333333-3333-4333-8333-333333333333";
const foreignLearner = "44444444-4444-4444-8444-444444444444";
const assignmentId = "55555555-5555-4555-8555-555555555555";
const quizId = "66666666-6666-4666-8666-666666666666";

function actor(role: MembershipRole, options: { suspended?: boolean; disabled?: boolean; foreignCollege?: boolean } = {}): RequestContext {
  return {
    user: {
      id: "faculty-user",
      identityUid: "faculty-identity",
      platformStatus: options.disabled ? "DISABLED" : "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: "faculty-membership",
      collegeId: options.foreignCollege ? "foreign-college" : "college-a",
      organizationId: "org-a",
      status: options.suspended ? "SUSPENDED" : "ACTIVE",
      roles: [role],
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  stubs.roster.mockResolvedValue({
    delivery: { id: deliveryId },
    roster: [
      { membershipId: learnerA, displayName: "Student A", email: null, rollNumber: "01" },
      { membershipId: learnerB, displayName: "Student B", email: null, rollNumber: "02" },
    ],
  });
  stubs.overview.mockResolvedValue({
    assignments: [{ id: assignmentId, deliveryId, title: "Assignment", status: "PUBLISHED", maxPoints: 10 }],
    quizzes: [{ id: quizId, deliveryId, title: "Quiz", status: "PUBLISHED" }],
  });
  stubs.assignmentReport.mockResolvedValue({
    submissions: [
      { membershipId: learnerA, gradePublished: true, gradingStatus: "GRADED", pointsAwarded: 8 },
      { membershipId: learnerB, gradePublished: false, gradingStatus: "GRADED", pointsAwarded: 9 },
      { membershipId: foreignLearner, gradePublished: true, gradingStatus: "GRADED", pointsAwarded: 10 },
    ],
  });
  stubs.quizReport.mockResolvedValue({ quiz: { resultsPublished: false }, latestAttempts: [] });
});

describe("Faculty gradebook service: tenant, role, and publication contract", () => {
  it("FAC-GRADE-SERVICE-01 rejects Mentor, Learner and College Admin before querying assessment or roster data", async () => {
    for (const role of ["MENTOR", "LEARNER", "COLLEGE_ADMIN"] satisfies MembershipRole[]) {
      await expect(getFacultyPublishedGradebook(actor(role), { deliveryId }))
        .rejects.toThrow("Missing permission: courses.read");
    }
    expect(stubs.roster).not.toHaveBeenCalled();
    expect(stubs.overview).not.toHaveBeenCalled();
  });

  it("FAC-GRADE-SERVICE-02 rejects disabled or suspended Faculty even if an old session still lists FACULTY", async () => {
    await expect(getFacultyPublishedGradebook(actor("FACULTY", { disabled: true }), { deliveryId }))
      .rejects.toThrow("Missing permission: courses.read");
    await expect(getFacultyPublishedGradebook(actor("FACULTY", { suspended: true }), { deliveryId }))
      .rejects.toThrow("Missing permission: courses.read");
    expect(stubs.roster).not.toHaveBeenCalled();
  });

  it("FAC-GRADE-SERVICE-03 rejects untrusted delivery IDs before any database read", async () => {
    await expect(getFacultyPublishedGradebook(actor("FACULTY"), { deliveryId: "not-a-uuid" }))
      .rejects.toThrow();
    await expect(getFacultyPublishedGradebook(actor("FACULTY"), { deliveryId, collegeId: "forged" }))
      .rejects.toThrow();
    expect(stubs.roster).not.toHaveBeenCalled();
    expect(stubs.overview).not.toHaveBeenCalled();
  });

  it("FAC-GRADE-SERVICE-04 exposes only published grades for the current Section roster and no private score arrays", async () => {
    const result = await getFacultyPublishedGradebook(actor("FACULTY"), { deliveryId });
    expect(result.publishedAssessments).toBe(1);
    expect(result.rosterSize).toBe(2);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      membershipId: learnerA, gradedCount: 1, earned: 8, possible: 10, percent: 80, hasUnknown: false,
    });
    expect(result.rows[1]).toMatchObject({
      membershipId: learnerB, gradedCount: 0, earned: null, possible: null, percent: null, hasUnknown: true,
    });
    expect(JSON.stringify(result)).not.toContain(foreignLearner);
    expect(result).not.toHaveProperty("scores");
    expect(result).not.toHaveProperty("assessments");
    expect(stubs.quizReport).toHaveBeenCalledWith(expect.anything(), quizId, deliveryId);
  });

  it("FAC-GRADE-SERVICE-05 publishes quiz scores only when the result release flag is actually on", async () => {
    stubs.quizReport.mockResolvedValue({
      quiz: { resultsPublished: true },
      latestAttempts: [
        { membershipId: learnerA, score: 9, maxScore: 10 },
        { membershipId: learnerB, score: 12, maxScore: 10 },
      ],
    });
    const result = await getFacultyPublishedGradebook(actor("FACULTY"), { deliveryId });
    expect(result.publishedAssessments).toBe(2);
    expect(result.rows[0]).toMatchObject({ earned: 17, possible: 20, percent: 85, gradedCount: 2 });
    expect(result.rows[1]).toMatchObject({ earned: null, possible: null, hasUnknown: true });
  });

  it("FAC-GRADE-SERVICE-06 private learner detail never returns scores for a foreign or unenrolled membership", async () => {
    await expect(getFacultyPublishedGradebookLearner(actor("FACULTY"), {
      deliveryId, learnerMembershipId: foreignLearner,
    })).rejects.toMatchObject({ code: "MEMBERSHIP_NOT_FOUND" });
    const result = await getFacultyPublishedGradebookLearner(actor("FACULTY"), {
      deliveryId, learnerMembershipId: learnerA,
    });
    expect(result.learner.membershipId).toBe(learnerA);
    expect(result.assessments).toHaveLength(1);
    expect(result.assessments[0]).toMatchObject({
      assessmentId: assignmentId, status: "PUBLISHED_SCORE", earned: 8, possible: 10,
    });
    expect(JSON.stringify(result)).not.toContain(foreignLearner);
  });

  it("FAC-GRADE-SERVICE-07 refuses oversized assessment sets instead of rendering an unbounded report", async () => {
    stubs.overview.mockResolvedValue({
      assignments: Array.from({ length: 101 }, (_, i) => ({
        id: "assignment-" + i, deliveryId, title: "Assessment " + i, status: "PUBLISHED", maxPoints: 10,
      })),
      quizzes: [],
    });
    await expect(getFacultyPublishedGradebook(actor("FACULTY"), { deliveryId }))
      .rejects.toMatchObject({ code: "FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS" });
    expect(stubs.assignmentReport).not.toHaveBeenCalled();
  });
});
