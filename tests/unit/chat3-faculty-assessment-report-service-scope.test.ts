import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const stubs = vi.hoisted(() => ({
  overview: vi.fn(),
  roster: vi.fn(),
  assignments: vi.fn(),
  quizzes: vi.fn(),
  quizDetails: vi.fn(),
}));
vi.mock("@/modules/courses/faculty-assessment-service", () => ({
  getFacultyAssessmentOverview: stubs.overview,
}));
vi.mock("@/modules/attendance/faculty-service", () => ({
  getFacultyDeliveryRoster: stubs.roster,
}));
vi.mock("@/modules/courses/assignment-submission-service", () => ({
  listAssignmentSubmissions: stubs.assignments,
}));
vi.mock("@/modules/courses/quiz-attempt-service", () => ({
  listQuizAttempts: stubs.quizzes,
}));
vi.mock("@/modules/courses/quiz-service", () => ({
  getCourseQuiz: stubs.quizDetails,
}));

import {
  getFacultyAssignmentReport,
  getFacultyQuizReport,
} from "@/modules/courses/faculty-assessment-report-service";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const wrongDelivery = "22222222-2222-4222-8222-222222222222";
const assignmentId = "33333333-3333-4333-8333-333333333333";
const quizId = "44444444-4444-4444-8444-444444444444";
const q1 = "55555555-5555-4555-8555-555555555555";
const a = "learner-a", b = "learner-b", otherCollege = "foreign-learner";
const oldDate = new Date("2099-01-03T10:00:00.000Z");
const newDate = new Date("2099-01-04T10:00:00.000Z");
const dueDate = new Date("2099-01-03T12:00:00.000Z");

const actor: RequestContext = {
  user: { id: "faculty", identityUid: "faculty", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "m", collegeId: "c", organizationId: "o", status: "ACTIVE", roles: ["FACULTY"] },
};

beforeEach(() => {
  vi.resetAllMocks();
  stubs.overview.mockResolvedValue({
    assignments: [{ id: assignmentId, deliveryId, title: "Assignment", maxPoints: 10, dueAt: dueDate }],
    quizzes: [{ id: quizId, deliveryId, title: "Quiz" }],
  });
  stubs.roster.mockResolvedValue({
    delivery: { id: deliveryId },
    roster: [{ membershipId: a }, { membershipId: b }],
  });
  stubs.assignments.mockResolvedValue([
    { membershipId: a, gradingStatus: "GRADED", gradePublished: true,
      submittedAt: oldDate, pointsAwarded: 8 },
    { membershipId: otherCollege, gradingStatus: "GRADED", gradePublished: true,
      submittedAt: newDate, pointsAwarded: 10 },
  ]);
  stubs.quizzes.mockResolvedValue([
    { membershipId: a, attemptNumber: 1, submittedAt: oldDate,
      score: 2, maxScore: 10, answers: [{ questionId: q1, correct: false }] },
    { membershipId: a, attemptNumber: 2, submittedAt: newDate,
      score: 9, maxScore: 10, answers: [{ questionId: q1, correct: true }] },
    { membershipId: otherCollege, attemptNumber: 1, submittedAt: newDate,
      score: 10, maxScore: 10, answers: [{ questionId: q1, correct: true }] },
  ]);
  stubs.quizDetails.mockResolvedValue({ questions: [{ id: q1, prompt: "Example?", points: 10 }] });
});

describe("FAC-REPORT-SERVICE-01 authenticated Section report projections", () => {
  it("hides foreign learner submissions before summary, export counts or distribution are computed", async () => {
    const result = await getFacultyAssignmentReport(actor, assignmentId, deliveryId);
    expect(result.submissions).toHaveLength(1);
    expect(result.submissions[0]?.membershipId).toBe(a);
    expect(result.missingLearners).toEqual([{ membershipId: b }]);
    expect(result.metrics).toMatchObject({
      eligibleLearners: 2, submitted: 1, missing: 1, onTime: 1,
      late: 0, graded: 1, gradePublished: 1, averagePercent: 80,
    });
    expect(JSON.stringify(result)).not.toContain(otherCollege);
    expect(stubs.assignments).toHaveBeenCalledWith(actor, assignmentId, deliveryId);
  });

  it("uses only the latest retake for question accuracy and scored results, with no foreign rows", async () => {
    const result = await getFacultyQuizReport(actor, quizId, deliveryId);
    expect(result.attempts).toHaveLength(2);
    expect(result.latestAttempts).toHaveLength(1);
    expect(result.latestAttempts[0]?.attemptNumber).toBe(2);
    expect(result.questions).toMatchObject([{
      id: q1, answeredCount: 1, correctCount: 1, accuracyPercent: 100,
    }]);
    expect(result.metrics).toMatchObject({
      eligibleLearners: 2, uniqueLearners: 1, submittedLearners: 1,
      notAttempted: 1, averagePercent: 90, totalAttempts: 2,
    });
    expect(JSON.stringify(result)).not.toContain(otherCollege);
    expect(stubs.quizDetails).toHaveBeenCalledWith(actor, quizId, deliveryId);
  });

  it("does not treat malformed, impossible grading data as a plausible passing average", async () => {
    stubs.assignments.mockResolvedValue([
      { membershipId: a, submittedAt: oldDate, pointsAwarded: Infinity,
        gradingStatus: "GRADED", gradePublished: false },
      { membershipId: b, submittedAt: oldDate, pointsAwarded: -1,
        gradingStatus: "GRADED", gradePublished: false },
    ]);
    const result = await getFacultyAssignmentReport(actor, assignmentId, deliveryId);
    expect(result.metrics).toMatchObject({
      submitted: 2, missing: 0, averagePercent: null, gradePublished: 0,
    });
    expect(result.distribution.every(row => row.count === 0)).toBe(true);
  });

  it("rejects non-UUID assessment references before invoking a scoped overview", async () => {
    await expect(getFacultyAssignmentReport(actor, "bad-id", deliveryId)).rejects.toThrow();
    await expect(getFacultyQuizReport(actor, quizId, "bad-delivery")).rejects.toThrow();
    expect(stubs.overview).not.toHaveBeenCalled();
  });

  it("does not read a quiz or assignment from a sibling teaching delivery", async () => {
    await expect(getFacultyAssignmentReport(actor, assignmentId, wrongDelivery))
      .rejects.toMatchObject({ code: "ASSIGNMENT_NOT_FOUND" });
    await expect(getFacultyQuizReport(actor, quizId, wrongDelivery))
      .rejects.toMatchObject({ code: "QUIZ_NOT_FOUND" });
    expect(stubs.assignments).not.toHaveBeenCalled();
    expect(stubs.quizzes).not.toHaveBeenCalled();
  });

  it("refuses ambiguous Section data without explicit delivery rather than selecting an arbitrary report", async () => {
    stubs.overview.mockResolvedValue({
      assignments: [
        { id: assignmentId, deliveryId, title: "A", maxPoints: 10, dueAt: dueDate },
        { id: assignmentId, deliveryId: wrongDelivery, title: "B", maxPoints: 10, dueAt: dueDate },
      ],
      quizzes: [
        { id: quizId, deliveryId, title: "A" },
        { id: quizId, deliveryId: wrongDelivery, title: "B" },
      ],
    });
    await expect(getFacultyAssignmentReport(actor, assignmentId, null))
      .rejects.toMatchObject({ code: "ASSIGNMENT_DELIVERY_MISMATCH" });
    await expect(getFacultyQuizReport(actor, quizId, null))
      .rejects.toMatchObject({ code: "QUIZ_DELIVERY_MISMATCH" });
    expect(stubs.roster).not.toHaveBeenCalled();
  });

  it("fails safely when roster or report source rejects an access grant after page load", async () => {
    stubs.roster.mockRejectedValueOnce(new Error("revoked faculty assignment"));
    await expect(getFacultyQuizReport(actor, quizId, deliveryId))
      .rejects.toThrow("revoked faculty assignment");
    expect(stubs.quizDetails).toHaveBeenCalledTimes(1);
  });
});
