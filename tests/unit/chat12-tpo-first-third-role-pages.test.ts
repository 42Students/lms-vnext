import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Source-contract tests of the TPO first-third navigation and denial states.
 * This suite does not claim E2E, accessibility or database transaction acceptance.
 */
const page = (route: string) => readFileSync(
  resolve(process.cwd(), "src/app/(authenticated)/tpo" + route + "/page.tsx"),
  "utf8",
);

describe("UX-tpo first-third role and failure-state contracts", () => {
  it("UX-tpo-01 canonical entry path redirects into TPO home", () => {
    expect(page("")).toContain('redirect("/tpo/home")');
  });

  it("UX-tpo-home-01 refuses to present TPO controls as available without tooling", () => {
    const source = page("/home");
    expect(source).toContain("hasTpoTooling(ctx)");
    expect(source).toContain("moduleAccess.placements.enabled");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-label="Placement overview"');
  });

  it("UX-tpo-batches-01 returns recoverable invalid-filter states rather than database queries", () => {
    const source = page("/batches");
    expect(source).toContain("batchDirectoryFilterSchema.safeParse");
    expect(source).toContain("tpoBatchPageSchema.safeParse");
    expect(source).toContain("deadlineParsed.success");
    expect(source).toContain("programParsed.success");
    expect(source).toContain('<Alert tone="error"');
    expect(source).toContain('href="/tpo/batches"');
    expect(source).toContain("Eligibility counts could not load");
  });

  it("UX-tpo-calendar-01 checks active TPO membership before fetching calendar data", () => {
    const source = page("/calendar");
    expect(source).toContain('hasMembershipRole(context, "TPO")');
    expect(source).toContain('redirect("/dashboard")');
    expect(source).toContain("parsed.success");
  });

  it("UX-tpo-announcements-01 denies an expired membership and rejects forged tab filters", () => {
    const source = page("/announcements");
    expect(source).toContain('hasMembershipRole(context,"TPO")');
    expect(source).toContain('redirect("/dashboard")');
    expect(source).toContain("tpoAnnouncementTabSchema.safeParse");
    expect(source).toContain('<Alert tone="error"');
    expect(source).toContain('href="/tpo/announcements"');
  });

  it("UX-tpo-audit-01 confines privileged audit views and provides invalid query recovery", () => {
    const source = page("/audit");
    expect(source).toContain('hasMembershipRole(context, "TPO")');
    expect(source).toContain('redirect("/dashboard")');
    expect(source).toContain("tpoAuditQuerySchema.safeParse");
    expect(source).toContain("<ErrorState");
    expect(source).toContain("Audit pagination");
  });

  it("UX-tpo-companies-01 scopes the directory before lookups and recovers invalid pagination", () => {
    const source = page("/companies");
    expect(source).toContain('can(context,"placements.manage"');
    expect(source).toContain('redirect("/dashboard")');
    expect(source).toContain("tpoCompaniesQuerySchema.safeParse");
    expect(source).toContain("<TpoCompaniesSpreadsheet");
    expect(source).toContain("No companies match these filters.");
    expect(source).toContain('aria-label="Companies pagination"');
  });

  it("UX-tpo-companies-companyId-01 returns the same not-found state for bad and absent company IDs", () => {
    const source = page("/companies/[companyId]");
    expect(source).toContain("tpoCompanyDetailQuerySchema.safeParse");
    expect(source).toContain("if (!parsed.success) notFound()");
    expect(source).toContain("if (!detail) notFound()");
    expect(source).toContain('can(context,"placements.manage"');
    expect(source).toContain("Recruiter contact activity storage is unavailable");
  });

  it("UX-tpo-companies-archived-01 keeps other-college archived employers out of the directory", () => {
    const source = page("/companies/archived");
    expect(source).toContain('hasMembershipRole(context, "TPO")');
    expect(source).toContain("listArchivedTpoCompanyRelationships(context)");
    expect(source).toContain('redirect("/dashboard")');
    expect(source).toContain("Showing only the first 100 archived relationships");
  });
});

describe("TPO-students-14 signed mutation endpoints", () => {
  for (const name of ["preview", "confirm"] as const) {
    it(`${name} checks same-origin before parsing or performing writes`, () => {
      const path = `src/app/api/placements/tpo/bulk-actions/${name}/route.ts`;
      const source = readFileSync(resolve(process.cwd(), path), "utf8");
      expect(source).toContain("isSameOriginRequest(request)");
      expect(source).toContain('error:"INVALID_ORIGIN"');
      expect(source).toContain("requireTpoJobCollege(context)");
      expect(source).toContain("readTpoBulkRequestBody(request)");
      expect(source).toContain('Cache-Control');
    });
  }
});
