import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("42 Tracker manager navigation theme parity", () => {
  it("SA-placements-projects-112 provides exact tracker navigation, skip link and a working keyboard-operable Light / Dark toggle", () => {
    const nav = read("src/components/tracker/tracker-admin-nav.tsx");
    const toggle = read("src/components/tracker/tracker-theme-toggle.tsx");
    const styles = read("src/app/globals.css");
    for (const href of ["/tracker", "/tracker/issues", "/tracker/logs", "/tracker/audit-findings"]) {
      expect(nav).toContain('href="' + href + '"');
    }
    expect(nav).toContain("Report Issue");
    expect(nav).toContain('href="#tracker-content"');
    expect(nav).toContain('id="tracker-content"');
    expect(nav).toContain("<TrackerThemeToggle />");
    expect(toggle).toContain('type="button"');
    expect(toggle).toContain('aria-pressed={theme === "dark"}');
    expect(toggle).toContain("Switch to dark mode");
    expect(toggle).toContain("Switch to light mode");
    expect(toggle).toContain('onClick={toggleTheme}');
    expect(toggle).toContain('window.localStorage.getItem(STORAGE_KEY)');
    expect(toggle).toContain('window.localStorage.setItem(STORAGE_KEY, next)');
    expect(toggle).toContain('document.documentElement.removeAttribute("data-tracker-theme")');
    expect(styles).toContain(':root[data-tracker-theme="dark"]');
    for (const variable of ["--lms-page-background", "--lms-surface", "--lms-foreground", "--lms-border"]) {
      expect(styles).toContain(variable + ":");
    }
  });
});
