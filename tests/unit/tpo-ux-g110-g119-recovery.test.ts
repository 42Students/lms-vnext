import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState } from "@/components/ui/empty-state";
import { TpoReportInvalidFilters } from "@/components/placements/tpo-report-invalid-filters";
import { tpoReportHasAmbiguousFilters } from "@/modules/placements/tpo-report-url-guard";

const page = (path: string) => readFileSync(`src/app/(authenticated)/tpo/${path}`, "utf8");

describe("TPO UX G110–G119: filters must not produce ambiguous results", () => {
  it("keeps one clear filter and rejects repeated values before data access", () => {
    expect(tpoReportHasAmbiguousFilters({ seasonId: "one", page: "2" })).toBe(false);
    expect(tpoReportHasAmbiguousFilters({ seasonId: undefined })).toBe(false);
    expect(tpoReportHasAmbiguousFilters({ seasonId: ["one", "two"] })).toBe(true);
    expect(tpoReportHasAmbiguousFilters({ page: ["1", "2"] })).toBe(true);
  });

  it("rejects duplicate scheduling-window values rather than using only the first", () => {
    const source = page("placements/schedule-conflicts/page.tsx");
    expect(source).toContain("Array.isArray(params.days) || !validated.success");
    expect(source).toContain("Repeated days filters were ignored");
    expect(source).toContain("Reset window");
    expect(source).toContain("days (from link)");
  });

  it("rejects ambiguous recruiter filters before rendering the scoped roster", () => {
    const source = page("recruiters/page.tsx");
    expect(source).toContain("Object.values(query).some(Array.isArray)");
    expect(source).toContain("Conflicting recruiter filters");
    expect(source).toContain('href="/tpo/recruiters"');
    expect(source.indexOf("Object.values(query).some(Array.isArray)")).toBeLessThan(
      source.indexOf("<RecruiterLeadsWorkspace"),
    );
  });

  it("applies the existing report guard to after-college and branch-season routes", () => {
    for (const segment of ["after-college", "branch-season"]) {
      const source = page(`reports/${segment}/page.tsx`);
      expect(source).toContain("tpoReportHasAmbiguousFilters");
      expect(source).toContain(`TpoReportInvalidFilters path="/tpo/reports/${segment}"`);
    }
  });

  it("rejects ambiguous campaign history and audience previews", () => {
    const history = page("recruiters/campaigns/page.tsx");
    const preview = page("recruiters/campaigns/preview/page.tsx");
    expect(history).toContain("Object.values(params).some(Array.isArray)");
    expect(history.indexOf("Object.values(params).some(Array.isArray)")).toBeLessThan(
      history.indexOf("listTpoMessagingHistory(context"),
    );
    expect(history).toContain("No campaign history was loaded");
    expect(preview).toContain("Array.isArray(raw.segment)||!query.success");
    expect(preview).toContain("No recipients were queried");
    expect(preview.indexOf("Array.isArray(raw.segment)||!query.success")).toBeLessThan(
      preview.indexOf("previewEngageCampaignAudience(context"),
    );
  });

  it("rejects invalid or repeated draft recipient pages before service queries", () => {
    const draft = page("recruiters/campaigns/drafts/[campaignId]/page.tsx");
    expect(draft).toContain("Array.isArray(raw.page)");
    expect(draft).toContain('!/^[1-9][0-9]{0,5}$/.test(raw.page)'); // explicit page validation
    expect(draft).toContain("Invalid recipient page");
    expect(draft).toContain("No campaign recipient records were loaded");
    expect(draft.indexOf("Array.isArray(raw.page)")).toBeLessThan(
      draft.indexOf("tpoCampaignDraftStorageReady()"),
    );
  });

  it("does not silently default invalid or repeated team sort values", () => {
    const source = page("settings/team/page.tsx");
    expect(source).toContain("Array.isArray(rawSort)");
    expect(source).toContain("Invalid team sorting");
    expect(source).toContain('href="/tpo/settings/team"');
  });
});

describe("TPO UX G114–G119: recovery controls and empty reports", () => {
  it("renders a legible recovery action and accessible status on narrow screens", () => {
    const html = renderToStaticMarkup(createElement(EmptyState, {
      title: "No placement season",
      description: "No outcomes were inferred.",
      action: createElement("a", { href: "/tpo/settings/season" }, "Review placement seasons"),
    }));
    expect(html).toContain('role="status"');
    expect(html).toContain("No outcomes were inferred.");
    expect(html).toContain('href="/tpo/settings/season"');
    expect(html).toContain("min-w-0");
  });

  it("supplies a clear route out of repeated report filters", () => {
    const html = renderToStaticMarkup(createElement(TpoReportInvalidFilters, {
      path: "/tpo/reports/branch-season",
    }));
    expect(html).toContain("Invalid report filters");
    expect(html).toContain("No report records were loaded");
    expect(html).toContain("Clear filters");
    expect(html).toContain("/tpo/reports/branch-season");
  });

  it("distinguishes missing seasons, filtered empty reports and unknown data", () => {
    const joining = page("reports/joining-followups/page.tsx");
    const summary = page("reports/placement-summary/page.tsx");
    expect(joining).toContain("Review placement seasons");
    expect(joining).toContain('report.state === "ALL"');
    expect(joining).toContain("View joining outcomes");
    expect(summary).toContain("Review placement seasons");
    expect(summary).toContain("do not represent zero historical placements");
    expect(page("reports/branch-season/page.tsx")).toContain("Review placement seasons");
    const branch = page("reports/branch-season/page.tsx");
    expect(branch).toContain("tpoBranchSeasonQuerySchema.safeParse");
    expect(branch).toContain("Invalid season filter");
    expect(branch).toContain("PLACEMENT_SEASON_NOT_FOUND");
    expect(branch).toContain("Season no longer available");
    expect(branch).toContain("Choose a current season");
  });

  it("provides settings recovery without inventing blocked dates or assignments", () => {
    const blocked = page("settings/blocked-dates/page.tsx");
    const linkError = page("settings/public-link/error.tsx");
    const prep = page("students/preparation-plan/page.tsx");
    expect(blocked).toContain("Existing dates may still be recorded");
    expect(blocked).toContain("Try loading dates again");
    expect(linkError).toContain('insideShell homeHref="/tpo/settings"');
    expect(prep).toContain("Review preparation settings");
    expect(prep).toContain("before treating any learner as assigned or complete");
    expect(prep).toContain("Saved preparation settings could not be validated");
  });
});
