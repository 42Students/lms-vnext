import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  workspace: vi.fn(),
  report: vi.fn(),
}));
vi.mock("@/modules/courses/faculty-course-service", () => ({
  getFacultyCourseWorkspace: state.workspace,
}));
vi.mock("@/modules/courses/faculty-assessment-report-service", () => ({
  getFacultyQuizReport: state.report,
}));
import {
  getFacultyQuizAttemptDrilldown,
} from "@/modules/courses/faculty-quiz-attempts-service";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const quizId = "22222222-2222-4222-8222-222222222222";
const questionId = "33333333-3333-4333-8333-333333333333";
const email = "sensitive.student@example.invalid";
const context = (): RequestContext => ({
  user: {
    id: "faculty-user",
    identityUid: "faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "faculty-member",
    collegeId: "college",
    organizationId: "organization",
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
});
const attempt = (id: string, displayName: string | null) => ({
  id,
  membershipId: "learner-member",
  learnerDisplayName: displayName,
  learnerEmail: email,
  attemptNumber: 1,
  submittedAt: new Date("2099-05-20T10:00:00.000Z"),
  score: 8,
  maxScore: 10,
  answers: [{
    questionId,
    correct: true,
    pointsAwarded: 8,
    pointsPossible: 10,
    selectedOptionId: "private-answer-identifier",
    selectedText: "private student selection",
  }],
});

beforeEach(() => {
  vi.resetAllMocks();
  state.workspace.mockResolvedValue({ course: { deliveryId } });
  state.report.mockResolvedValue({
    quiz: { id: quizId, title: "Assessment" },
    questions: [{ id: questionId, prompt: "Question 1" }],
    attempts: [attempt("attempt-a", null), attempt("attempt-b", "  Learner B  ")],
    latestAttempts: [attempt("attempt-a", null), attempt("attempt-b", "  Learner B  ")],
  });
});

describe("FAC-QUIZ-PII-01 masked learner contact in attempt analysis", () => {
  it("uses a neutral learner label for a missing display name, never their email or raw answer selection", async () => {
    const result = await getFacultyQuizAttemptDrilldown(context(), { quizId, deliveryId });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      learnerName: "Learner",
      answered: 1,
      correct: 1,
      score: 8,
      maxScore: 10,
    });
    expect(result.items[1]?.learnerName).toBe("Learner B");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain("private-answer-identifier");
    expect(serialized).not.toContain("private student selection");
    expect(result.items[0]?.questionResults[0]).toMatchObject({
      questionId,
      correct: true,
      pointsAwarded: 8,
      pointsPossible: 10,
    });
  });

  it("denies Mentor, Learner, College Admin, inactive and missing Faculty before any data lookup", async () => {
    const base = context();
    for (const user of [
      { ...base, membership: { ...base.membership!, roles: ["MENTOR"] as const } },
      { ...base, membership: { ...base.membership!, roles: ["LEARNER"] as const } },
      { ...base, membership: { ...base.membership!, roles: ["COLLEGE_ADMIN"] as const } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" as const } },
      { ...base, user: { ...base.user, platformStatus: "DISABLED" as const } },
      { ...base, membership: null },
    ]) {
      await expect(getFacultyQuizAttemptDrilldown(user, { quizId, deliveryId }))
        .rejects.toThrow("Missing permission: courses.read");
    }
    expect(state.workspace).not.toHaveBeenCalled();
    expect(state.report).not.toHaveBeenCalled();
  });

  it("rejects unexpected tenant selectors and invalid quiz ID before loading the teaching Section", async () => {
    for (const query of [
      { quizId: "invalid", deliveryId },
      { quizId, deliveryId: "invalid" },
      { quizId, deliveryId, collegeId: "other" },
      { quizId, deliveryId, page: -1 },
      { quizId, deliveryId, view: "UNKNOWN" },
    ]) {
      await expect(getFacultyQuizAttemptDrilldown(context(), query)).rejects.toThrow();
    }
    expect(state.workspace).not.toHaveBeenCalled();
  });

  it("loads the exact authorized delivery before the quiz report and fails shut after teaching revocation", async () => {
    state.workspace.mockRejectedValueOnce(new Error("revoked assignment"));
    await expect(getFacultyQuizAttemptDrilldown(context(), { quizId, deliveryId }))
      .rejects.toThrow("revoked assignment");
    expect(state.report).not.toHaveBeenCalled();
    await getFacultyQuizAttemptDrilldown(context(), { quizId, deliveryId });
    expect(state.workspace).toHaveBeenCalledWith(expect.anything(), deliveryId);
    expect(state.report).toHaveBeenCalledWith(expect.anything(), quizId, deliveryId);
  });
});
