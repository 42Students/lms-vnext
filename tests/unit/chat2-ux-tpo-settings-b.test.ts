import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("TPO settings UX semantics", () => {
  it("UX-tpo-tpo-settings-notices-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/notices/page.tsx"), "utf8");
    expect(source).toMatch(/<h1\b|<PageHeader\b/);
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-public-link-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/public-link/page.tsx"), "utf8");
    expect(source).toContain("title=\"Public recruiter link\"");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-prep-readiness-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx"), "utf8");
    expect(source).toContain("title=\"Prep readiness\"");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-public-page-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/public-page/page.tsx"), "utf8");
    expect(source).toMatch(/<h1\b|<PageHeader\b/);
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-notifications-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/notifications/page.tsx"), "utf8");
    expect(source).toContain("title=\"My Notifications\"");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-recruiters-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/recruiters/page.tsx"), "utf8");
    expect(source).toContain("title=\"Recruiter access\"");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-rules-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/rules/page.tsx"), "utf8");
    expect(source).toContain("Placement rules");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-team-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/team/page.tsx"), "utf8");
    expect(source).toContain("title=\"Placement team\"");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-season-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/season/page.tsx"), "utf8");
    expect(source).toContain("title=\"Placement Season\"");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-see-01 keeps legacy heading and touch-safe controls", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/see/page.tsx"), "utf8");
    expect(source).toContain("title=\"What companies see\"");
    expect(source).not.toContain("min-h-10");
  });
});
