import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Faculty quiz report legacy header", () => {
  it("FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metrics", () => {
    const source = readFileSync("src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx", "utf8");
    expect(source).toContain('href="/teacher/allQuizzes"');
    expect(source).toContain('        Back');
    expect(source).toContain('["Submitted",');
    expect(source).toContain('["Average score",');
    expect(source).toContain('["Questions", metrics.questionCount]');
    expect(source).toContain('["Due date", quiz.dueAt ? facultyReportIstTimestamp(quiz.dueAt) : "—"]');
    expect(source).not.toContain('["Total attempts", metrics.totalAttempts]');
    expect(source).toContain('"Total attempts: " + metrics.totalAttempts');
  });
});
