import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const progress = () => readFileSync("src/components/shell/route-progress.tsx", "utf8");
const css = () => readFileSync("src/components/shell/route-progress.css", "utf8");
const shell = () => readFileSync("src/components/shell/app-shell.tsx", "utf8");
const legacy = () => readFileSync("docs/design/old-lms-shell.css", "utf8");

/** Source-only guardrails; builder does not run tests/CI. */
describe("chat-19 route progress and shell ownership", () => {
  it("reuses exactly the old sidebar active-teal source and remains nonblocking", () => {
    expect(legacy()).toContain("rgb(38, 186, 199)");
    expect(css()).toContain("background:#26bac7");
    expect(css()).toContain("pointer-events:none");
    expect(css()).toContain("z-index:998");
  });
  it("has reduced-motion treatment for an indeterminate indicator", () => {
    expect(css()).toContain("@media (prefers-reduced-motion:reduce)");
    expect(css()).toContain("animation:none");
    expect(progress()).toContain('role="progressbar"');
    expect(progress()).toContain('aria-label="Opening page"');
    expect(progress()).not.toContain("aria-valuenow");
  });
  it("rejects external, modified, download, disabled and same-page links", () => {
    for (const guard of ["event.defaultPrevented", "event.metaKey", "event.ctrlKey",
      'anchor.hasAttribute("download")', 'anchor.getAttribute("aria-disabled")',
      "destination.origin !== window.location.origin", "destination.pathname === pathname"]) {
      expect(progress()).toContain(guard);
    }
  });
  it("recovers after uncommitted navigation and unregisters its listeners", () => {
    expect(progress()).toContain("window.setTimeout(clearPending, 8000)");
    expect(progress()).toContain('document.addEventListener("click", onClick, true)');
    expect(progress()).toContain('document.removeEventListener("click", onClick, true)');
    expect(progress()).toContain('window.removeEventListener("popstate", onPopState)');
    expect(progress()).toContain("window.clearTimeout(timer.current)");
  });
  it("mounts exactly once after topbar and outside main", () => {
    const x = shell();
    expect(x).toContain('import { RouteProgress } from "./route-progress"');
    expect(x.match(/<RouteProgress \/>/g)?.length).toBe(1);
    expect(x.indexOf("<RouteProgress />")).toBeGreaterThan(x.indexOf("<LegacyTopbar"));
    expect(x.indexOf("<RouteProgress />")).toBeLessThan(x.indexOf("<main id="));
  });
});
