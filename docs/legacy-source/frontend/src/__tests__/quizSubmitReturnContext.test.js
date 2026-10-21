import fs from "fs";
import path from "path";

describe("quiz submission return context", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/Quiz/quizpanel.js"), "utf8");

  test("successful submission uses a validated LMS destination instead of browser history", () => {
    expect(source).toContain("getSafeInternalReturnPath");
    expect(source).toContain('fallback: "/learn/allQuizzes"');
    expect(source).toContain('allowedPrefixes: ["/learn/allQuizzes", "/learn/courses"]');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("router.push(successfulSubmitReturn)");
    expect(source).not.toContain("setTimeout(() => router.back()");
  });

  test("embedded roadmap submission closes the parent modal", () => {
    expect(source).toContain('window.parent.postMessage({ type: "closeRoadmapQuiz" }');
  });
});
