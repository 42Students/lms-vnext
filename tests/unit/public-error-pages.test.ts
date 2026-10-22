import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("shared public error pages", () => {
  it("GR-13 keeps a customer-friendly no-code 404 route", () => {
    const page = read("src/app/not-found.tsx");
    expect(page).toContain('title="Page not found"');
    expect(page).toContain('homeHref={homeHref}');
    expect(page).toContain('let homeHref = "/dashboard"');
    expect(page).not.toContain('code="404"');
  });
  it("GR-11 uses a root fatal boundary without exposing error internals", () => {
    const page = read("src/app/global-error.tsx");
    expect(page).toContain("GracefulErrorBoundary");
    expect(page).toContain("<html");
    expect(page).not.toContain("{error.message}");
    const screen = read("src/components/public/graceful-screen.tsx");
    expect(screen).toContain("Copy reference");
    expect(screen).toContain("Try again");
    expect(screen).toContain("Go to home");
  });
});
