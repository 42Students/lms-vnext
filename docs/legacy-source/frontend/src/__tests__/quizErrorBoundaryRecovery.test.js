import fs from "fs";
import path from "path";

describe("standalone quiz error recovery", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/pages/quiz.js"), "utf8");

  test("boundary resets when quiz/navigation identity changes", () => {
    expect(source).toContain("componentDidUpdate(prevProps)");
    expect(source).toContain("prevProps.resetKey !== this.props.resetKey");
    expect(source).toContain("resetKey={resetKey}");
  });

  test("fallback exposes retry, reload and a deterministic safe exit", () => {
    expect(source).toContain("handleReload");
    expect(source).toContain("Refresh page");
    expect(source).toContain("Back to quizzes");
    expect(source).toContain('router.push("/learn/allQuizzes")');
  });

  test("render crashes are reported without exposing raw error text", () => {
    expect(source).toContain("reportReactBoundaryError(error, errorInfo)");
  });
});
