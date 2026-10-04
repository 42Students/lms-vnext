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
        "src/app/(authenticated)/learn/assignments/page.tsx",
      ),
      "utf8",
    );
    const quizzes = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/learn/quizzes/page.tsx",
      ),
      "utf8",
    );

    expect(shell).toContain(
      'href: "/learn/assignments"',
    );
    expect(shell).toContain(
      'href: "/learn/quizzes"',
    );
    expect(assignments).toContain(
      'title="All Assignments"',
    );
    expect(quizzes).toContain(
      'title="All Quizzes"',
    );
  });
});
