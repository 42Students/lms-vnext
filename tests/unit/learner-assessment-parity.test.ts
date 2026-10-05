import fs from "node:fs";
import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

describe("learner assessment parity pages", () => {
  it("keeps dedicated learner Assignments and Quizzes destinations", () => {
    const shell = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/shell/shell-model.ts",
      ),
      "utf8",
    );
    const assignments = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/learn/allAssignments/page.tsx",
      ),
      "utf8",
    );
    const quizzes = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/learn/allQuizzes/page.tsx",
      ),
      "utf8",
    );

    expect(shell).toContain(
      'href: "/learn/allAssignments"',
    );
    expect(shell).toContain(
      'href: "/learn/allQuizzes"',
    );
    expect(assignments).toContain(
      'title="All Assignments"',
    );
    expect(quizzes).toContain(
      'title="All Quizzes"',
    );
  });

  it("materializes the standalone quiz attempt instead of leaving an empty shell", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "src/app/quiz/page.tsx"),
      "utf8",
    );
    const attempt = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/courses/learner-quiz-attempt.tsx",
      ),
      "utf8",
    );
    const overview = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/courses/learner-assessment-overview.tsx",
      ),
      "utf8",
    );

    expect(page).toContain("LearnerQuizAttempt");
    expect(attempt).toContain("Question");
    expect(attempt).toContain("sessionStorage");
    expect(attempt).toContain("/submit");
    expect(attempt).toContain("review=true");
    expect(overview).toContain("/quiz?quizId=");
  });
});
