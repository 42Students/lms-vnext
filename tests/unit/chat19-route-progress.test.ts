import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const progress = () => readFileSync("src/components/shell/route-progress.tsx", "utf8");
const css = () => readFileSync("src/components/shell/route-progress.css", "utf8");
const shell = () => readFileSync("src/components/shell/app-shell.tsx", "utf8");
const legacy = () => readFileSync("docs/design/old-lms-shell.css", "utf8");

/** Source-only guardrails; builder does not run tests/CI. */
describe("chat-19 route progress and shell ownership", () => {
  it("omits a top route strip absent from the original LMS", () => {
    expect(legacy()).toContain("fl-d-panel-l");
    expect(css()).not.toContain(".lms-route-progress");
    expect(progress()).not.toContain('role="progressbar"');
    expect(progress()).toContain("if (!pending || !slow) return null");
    expect(progress()).toContain('data-slot="legacy-page-loader"');
    expect(css()).toContain("background:rgba(255,255,255,.99)");
    expect(css()).toContain("z-index:999");
  });
  it("keeps reduced-motion treatment for the original four-dot loader", () => {
    expect(css()).toContain("@media (prefers-reduced-motion:reduce)");
    expect(css()).toContain("animation:none");
    expect(progress()).toContain('role="status"');
    expect(progress()).toContain('aria-label="Loading page"');
  });
  it("rejects external, modified, download, disabled and same-page links", () => {
    for (const guard of ["event.defaultPrevented", "event.metaKey", "event.ctrlKey",
      'anchor.hasAttribute("download")', 'anchor.getAttribute("aria-disabled")',
      "destination.origin !== window.location.origin", "destination.pathname === pathname"]) {
      expect(progress()).toContain(guard);
    }
  });
  it("recovers after uncommitted navigation and unregisters its listeners", () => {
    expect(progress()).toContain("window.setTimeout(clearPending, 30_000)");
    expect(progress()).toContain("window.setTimeout(() => setStalled(true), 20_000)");
    expect(progress()).toContain("window.setTimeout(() => setSlow(true), 700)");
    expect(progress()).toContain('document.addEventListener("click", onClick, true)');
    expect(progress()).toContain('document.removeEventListener("click", onClick, true)');
    expect(progress()).toContain('window.removeEventListener("popstate", onPopState)');
    expect(progress()).toContain("window.clearTimeout(value.current)");
  });
  it("clears progress for query-only browser history without pathname commits", () => {
    const source = progress();
    expect(source).toContain('const onPopState = () => {');
    expect(source).toContain('if (window.location.pathname === pathname)');
    expect(source).toContain('clearPending();');
    expect(source).toContain('window.addEventListener("popstate", onPopState)');
  });
  it("keeps the legacy large AntD four-dot delay pattern", () => {
    const source = css();
    expect(source).toContain("font-size:32px");
    expect(source).toContain("width:14px");
    expect(source).toContain("height:14px");
    expect(source).toContain("transform:scale(.75)");
    expect(source).toContain("animation:lms-legacy-spin-move 1s infinite linear alternate");
    for (const delay of [".4s", ".8s", "1.2s"]) {
      expect(source).toContain("animation-delay:"+delay);
    }
    expect(source).toContain(".lms-legacy-loader-dots,.lms-legacy-loader-dots i {animation:none;}");
  });
  it("mounts exactly once after topbar and outside main", () => {
    const x = shell();
    expect(x).toContain('import { RouteProgress } from "./route-progress"');
    expect(x.match(/<RouteProgress \/>/g)?.length).toBe(1);
    expect(x.indexOf("<RouteProgress />")).toBeGreaterThan(x.indexOf("<LegacyTopbar"));
    expect(x.indexOf("<RouteProgress />")).toBeLessThan(x.indexOf("<main id="));
  });
});
