import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({ report: vi.fn() }));
vi.mock("@/modules/courses/faculty-assessment-report-service", () => ({
  getFacultyQuizReport: stubs.report,
}));
import {
  getFacultyQuizQuestionCsvForDownload,
} from "@/modules/courses/faculty-quiz-question-csv-service";
import { FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS } from "@/modules/courses/faculty-quiz-question-csv";

const quizId = "11111111-1111-4111-8111-111111111111";
const deliveryId = "22222222-2222-4222-8222-222222222222";
const anotherCollege = "33333333-3333-4333-8333-333333333333";
const actor: RequestContext = {
  user: { id: "faculty-user", identityUid: "faculty", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: "faculty-member", collegeId: "college", organizationId: "org",
    status: "ACTIVE", roles: ["FACULTY"],
  },
};
const raw = { quizId, deliveryId };
beforeEach(() => {
  vi.resetAllMocks();
  stubs.report.mockResolvedValue({
    quiz: { title: "Quiz 1", sectionName: "Section A" },
    questions: [{
      prompt: '=HYPERLINK("malicious"), తెలుగు',
      points: 2, answeredCount: 3, correctCount: 2, accuracyPercent: 67,
    }],
  });
});

describe("FAC-QUIZ-CSV-SERVICE-01 scoped quiz aggregate report", () => {
  it("requests an exact authenticated quiz and Section before returning aggregate-only CSV", async () => {
    const result = await getFacultyQuizQuestionCsvForDownload(actor, raw);
    expect(stubs.report).toHaveBeenCalledWith(actor, quizId, deliveryId);
    expect(result.omittedRows).toBe(0);
    expect(result.csv).toContain("Question");
    expect(result.csv).toContain('"\'=HYPERLINK');
    expect(result.csv).toContain("తెలుగు");
    expect(result.csv).not.toContain("learnerEmail");
    expect(result.csv).not.toContain("learnerPhone");
    expect(result.filename).toMatch(/^faculty-quiz-report-[a-z0-9-]+\.csv$/);
  });

  it("rejects caller-selected tenant, extra export keys, and invalid UUIDs before reading the Section", async () => {
    for (const invalid of [
      { ...raw, collegeId: anotherCollege },
      { ...raw, membershipId: "foreign" },
      { ...raw, quizId: "invalid" },
      { ...raw, deliveryId: "invalid" },
    ]) {
      await expect(getFacultyQuizQuestionCsvForDownload(actor, invalid)).rejects.toThrow();
    }
    expect(stubs.report).not.toHaveBeenCalled();
  });

  it("applies a hard question cap with a truthful notice without exporting private answers", async () => {
    stubs.report.mockResolvedValue({
      quiz: { title: "Question analysis", sectionName: "A" },
      questions: Array.from({ length: FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS + 1 }, (_, i) => ({
        prompt: "Question " + i,
        points: 1,
        answeredCount: 1,
        correctCount: 0,
        accuracyPercent: 0,
      })),
    });
    const result = await getFacultyQuizQuestionCsvForDownload(actor, raw);
    expect(result.omittedRows).toBe(1);
    expect(result.csv).toContain("1 more questions omitted by the 500-row cap.");
    expect(result.csv).not.toContain("Question 500");
  });

  it("propagates an expired teaching-grant denial rather than writing a private quiz export", async () => {
    stubs.report.mockRejectedValueOnce(new Error("Faculty teaching grant revoked"));
    await expect(getFacultyQuizQuestionCsvForDownload(actor, raw))
      .rejects.toThrow("Faculty teaching grant revoked");
  });
});
