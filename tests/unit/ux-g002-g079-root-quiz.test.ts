import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("UX-G002 root sign-in journey", () => {
  const root = read("src/app/page.tsx");
  it("keeps legacy Super Admin OTP entry instead of sending it to marketing", () => {
    expect(root).toContain('legacySuperAdmin) redirect("/home")');
    expect(root).toContain('data-legacy-superadmin={legacySuperAdmin||undefined}');
    expect(root).toContain('legacySuperAdmin&&signin.phone');
    expect(root).toContain('effectiveCollegeSignInCapabilities(');
    expect(root).toContain('safeReturnTo(requested)');
  });
  it("keeps friendly auth recovery and sign-in focus landmark", () => {
    expect(root).toContain('href="#sign-in-content"');
    expect(root).toContain('id="sign-in-content" tabIndex={-1}');
    expect(root).toContain('Start a fresh sign-in');
    expect(root).toContain('role="alert"');
    expect(root).not.toContain('redirect(requested)');
  });
  it("authenticated root loading is named and error stays inside the role shell", () => {
    const loading = read("src/app/(authenticated)/loading.tsx");
    const error = read("src/app/(authenticated)/error.tsx");
    expect(loading).toContain("Loading your workspace…");
    expect(loading).toContain("GracefulPageLoading");
    expect(error).toContain("GracefulErrorBoundary");
    expect(error).toContain("legacyWorkspaceCopy insideShell");
    expect(error).toContain('min-w-0 max-w-full');
  });
});

describe("UX-G079 quiz entry journey", () => {
  it("keeps all quiz controls while improving the focusable cancel action", () => {
    const page = read("src/app/quiz/page.tsx");
    expect(page).toContain("LearnerQuizAttempt");
    expect(page).toContain("Suspense");
    expect(page).toContain("Cancel quiz and return to All Quizzes");
    expect(page).toContain('href="/learn/allQuizzes"');
    expect(page).toContain('alt=""');
    expect(page).toContain('focus-ring');
  });
  it("has bounded named loading and usable phone error recovery", () => {
    const loading = read("src/app/quiz/loading.tsx");
    const error = read("src/app/quiz/error.tsx");
    expect(loading).toContain('label="Loading quiz…"');
    expect(loading).toContain("GracefulPageLoading");
    expect(error).toContain('className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}');
    expect(error).toContain("Back to quizzes");
    expect(error).toContain('role="alert"');
    expect(error).toContain("previous.current!==routeKey");
  });
});
