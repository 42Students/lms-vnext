import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("TPO request and settings route UX contracts", () => {
  it("UX-tpo-tpo-requests-01 preserves route hierarchy and 44px interaction baseline", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/requests/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-01 preserves route hierarchy and 44px interaction baseline", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/page.tsx"), "utf8");
    expect(source).toContain("TpoLegacySettingsRedirect");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-after-college-01 preserves route hierarchy and 44px interaction baseline", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/after-college/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-blocked-dates-01 preserves route hierarchy and 44px interaction baseline", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-branding-01 preserves route hierarchy and 44px interaction baseline", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/branding/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-job-types-01 preserves route hierarchy and 44px interaction baseline", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/job-types/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });
});
