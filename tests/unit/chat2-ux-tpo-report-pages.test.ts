import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("TPO report route UX contracts", () => {
  it("UX-tpo-tpo-reports-ctc-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/ctc/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-intelligence-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/intelligence/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-failure-reasons-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-by-branch-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/by-branch/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-by-company-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/by-company/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-joining-followups-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/joining-followups/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-joining-status-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/joining-status/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-leads-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/leads/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-offers-acceptance-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });

  it("UX-tpo-tpo-reports-offers-expiry-01 uses accessible filter loading and 44px actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });
  it("UX-tpo-tpo-reports-placed-branch-01 shows accessible loading while report filters resolve", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/placed-branch/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });
  it("UX-tpo-tpo-reports-placement-summary-01 shows accessible loading while report filters resolve", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/placement-summary/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });
  it("UX-tpo-tpo-reports-season-pipeline-01 shows accessible loading while report filters resolve", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });
  it("UX-tpo-tpo-reports-unplaced-01 shows accessible loading while report filters resolve", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(authenticated)/tpo/reports/unplaced/page.tsx"), "utf8");
    // Route-level loading boundary owns the shared skeleton while the page
    // keeps a fail-closed invalid-filter branch and an explicit heading.
    const loading=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
    expect(loading).toContain("<GracefulPageLoading");
    expect(source).toContain("tpoReportHasAmbiguousFilters");
    expect(source).toContain("TpoReportInvalidFilters");
    expect(source).toContain("PageHeader");
    expect(source).not.toContain("min-h-10");
  });
});
