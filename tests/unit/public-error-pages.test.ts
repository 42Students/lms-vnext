import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("shared public error pages", () => {
  it("keeps the legacy 404 copy with Next's not-found route", () => {
    const page = read("src/app/not-found.tsx");
    expect(page).toContain('code="404"');
    expect(page).toContain('title="Page Not Found"');
    expect(page).toContain("doesn't exist or has moved");
  });

  it("uses Next's root fatal boundary without exposing error internals", () => {
    const page = read("src/app/global-error.tsx");
    expect(page).toContain('code="500"');
    expect(page).toContain('title="Server Error"');
    expect(page).toContain("retry={reset}");
    expect(page).toContain("<html");
    expect(page).not.toContain("{error.message}");
  });

  it("offers go-back and home routes with an optional retry action", () => {
    const actions = read("src/components/public/error-recovery-actions.tsx");
    expect(actions).toContain("Go back");
    expect(actions).toContain('href="/"');
    expect(actions).toContain("Go to Home");
    expect(actions).toContain("Try again");
    expect(actions).toContain("window.history.back()");
  });
});
