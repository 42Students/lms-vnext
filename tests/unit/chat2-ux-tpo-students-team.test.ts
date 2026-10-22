import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("TPO student and team UX contracts", () => {
  it("UX-tpo-tpo-students-membershipId-history-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-students-membershipId-participation-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-students-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/students/page.tsx"), "utf8");
    expect(source).toContain("TpoStudentsSpreadsheet");
    expect(source).not.toContain("mobileActionsCollapsible");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-trusted-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/trusted/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-settings-templates-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/settings/templates/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-students-preparation-plan-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/students/preparation-plan/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-students-preparation-prep-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/students/preparation-prep/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-students-requests-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/students/requests/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-team-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/team/page.tsx"), "utf8");
    expect(source).toContain('hasPlacementTeamMembership(context)');
    expect(source).toContain('redirect("/tpo/messages?"');
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-team-threadId-01 preserves page semantics and responsive action targets", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/team/[threadId]/page.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("min-h-10");
  });
});
