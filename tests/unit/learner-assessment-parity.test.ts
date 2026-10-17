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
    expect(attempt).toContain("submittingRef");
    expect(attempt).toContain("submit-lock");
    expect(attempt).toContain("30_000");
    expect(attempt).toContain("unanswered question");
    expect(attempt).toContain("router.back()");
    expect(attempt).toContain("setTimeout");
    expect(overview).toContain("/quiz?quizId=");
  });
  it("keeps legacy aggregate assessment mechanics", () => {
    const overview = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/courses/learner-assessment-overview.tsx",
      ),
      "utf8",
    );

    // Assignment status was extracted to an independently tested domain policy.
    const assignmentState = fs.readFileSync(
      path.join(process.cwd(), "src/modules/courses/learner-assignment-display.ts"),
      "utf8",
    );
    expect(overview).toContain("assignmentOverviewState");
    expect(assignmentState).toContain("Submitted late");
    expect(overview).toContain("PAGE_SIZE = 20");
    expect(overview).toContain("Page {currentPage} of {totalPages}");
    expect(overview).toContain("filter=assessments");
    expect(overview).toContain("lesson=");
    expect(overview).toContain("Created ");
    // The per-state action labels live in the extracted quiz-overview-state.
    const quizState = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/courses/quiz-overview-state.ts",
      ),
      "utf8",
    );
    expect(overview).toContain("quizOverviewActionState");
    expect(quizState).toContain("View answers");
  });

  it("keeps explicit aggregate loading and error boundaries", () => {
    for (const family of ["allAssignments", "allQuizzes"]) {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            `src/app/(authenticated)/learn/${family}/loading.tsx`,
          ),
        ),
      ).toBe(true);
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            `src/app/(authenticated)/learn/${family}/error.tsx`,
          ),
        ),
      ).toBe(true);
    }
  });
});
