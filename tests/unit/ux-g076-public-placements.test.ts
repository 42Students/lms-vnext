import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const publicPage = read("src/app/placements/page.tsx");
const publicRecruit = read("src/components/placements/public-recruit-from-us.tsx");
const retired = read("src/app/placements/jobs/[jobId]/page.tsx");

describe("UX-G076 public placements disclosure and recovery", () => {
  it("retries transient tenant lookup outages without disclosing unknown hosts", () => {
    const unavailable = publicPage.indexOf('tenant.kind === "unavailable"');
    const unknown = publicPage.indexOf('if (tenant.kind !== "college") notFound()');
    expect(unavailable).toBeGreaterThan(-1);
    expect(unavailable).toBeLessThan(unknown);
    expect(publicPage).toContain("PUBLIC_PLACEMENTS_TENANT_LOOKUP_UNAVAILABLE");
    expect(publicPage).toContain("PUBLIC_PLACEMENTS_PUBLICATION_NOT_READY");
    expect(publicPage).toContain("(publicRead?.available&&!published)");
    expect(publicPage).toContain("PUBLIC_PLACEMENTS_TEMPORARILY_UNAVAILABLE");
  });
  it("does not render suppressed numbers or individual records", () => {
    expect(publicPage).toContain("publicPlacementDisclosure([");
    expect(publicPage).toContain("metrics.find(item=>item.label===label)?.suppressed");
    expect(publicPage).toContain("return value===null?[]");
    expect(publicPage).toContain('aria-label="Public placements statistics"');
    expect(publicPage).toContain('aria-labelledby="public-placement-outcomes"');
    expect(publicPage).toContain("Placement statistics are not available for public display");
    expect(publicPage).toContain("Individual student and employer records are not shown");
  });
  it("preserves recruiter OTP and trusted proxy readiness gates", () => {
    expect(publicPage).toContain('process.env["DB09_TPO_API_READY"] === "DB09_VERIFIED"');
    expect(publicPage).toContain('process.env["PUBLIC_JOIN_TRUSTED_PROXY_READY"] === "VERIFIED"');
    expect(publicRecruit).toContain("publicRecruiterWorkEmailSchema");
    expect(publicRecruit).toContain("if(savingRef.current)return");
  });
  it("exposes understandable responsive loading, retry and unpublished states", () => {
    const loading = read("src/app/placements/loading.tsx");
    const error = read("src/app/placements/error.tsx");
    const notFound = read("src/app/placements/not-found.tsx");
    for (const text of [publicPage,loading,error,notFound]) {
      expect(text).toContain("min-h-dvh");
      expect(text).toContain("min-w-0");
    }
    expect(loading).toContain('aria-busy="true"');
    expect(error).toContain('role="alert"');
    expect(error).toContain("onClick={reset}");
    expect(notFound).toContain('role="status"');
    expect(notFound).toContain("this isn't a college link");
  });
  it("keeps retired shared job links private, noindexed and navigable", () => {
    expect(retired).toContain("robots: { index: false, follow: false }");
    expect(retired).toContain('data-testid="placements.retired-job-link"');
    expect(retired).toContain('aria-label="Placement page actions"');
    expect(retired).toContain('href="/login?next=%2Flearn%2Fmy-placements%2Fjobs"');
    expect(retired).toContain('href="/placements"');
    expect(retired).not.toMatch(/getPublicJob|placementJobs|jobId.*fetch/);
    expect(retired).toContain("sm:flex-row");
  });
});
