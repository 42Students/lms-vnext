import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const source = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("Learner Placement Rules working editor navigation", () => {
  it("exposes a verified placement preparation panel and real route recovery states", () => {
    const rules = source("src/app/(authenticated)/learn/my-placements/rules/page.tsx");
    const service = source("src/modules/placements/learner-placement-rules-service.ts");
    expect(rules).toContain("Where you stand");
    expect(rules).toContain("preparation.criteria.map");
    expect(rules).toContain("learnerPlacementRulesQuerySchema.safeParse");
    expect(service).toContain("requireLearnerPlacementAccess(context)");
    expect(service).toContain('requirePermission(context, "placements.read"');
    const loading = source("src/app/(authenticated)/learn/my-placements/rules/loading.tsx");
    const error = source("src/app/(authenticated)/learn/my-placements/rules/error.tsx");
    expect(loading).toContain("Loading");
    expect(error).toContain("Retry");
  });

  it("sets a safe back origin from the two existing placement entrypoints", () => {
    const cell = source("src/app/(authenticated)/learn/my-placements/placement/page.tsx");
    const drives = source("src/app/(authenticated)/learn/my-placements/jobs/page.tsx");
    expect(cell).toContain('/learn/my-placements/rules?from=cell');
    expect(drives).toContain('/learn/my-placements/rules?from=drives');
  });

  it("links academic evidence to its actual Learner placement editor", () => {
    const rules = source("src/app/(authenticated)/learn/my-placements/rules/page.tsx");
    const target = source("src/components/placements/learner-placement-academic-evidence.tsx");
    expect(rules).toContain('href="/learn/my-placements#placement-academic-evidence"');
    expect(target).toContain('id="placement-academic-evidence"');
    expect(rules).not.toContain("/learn/profile#academic-record");
  });
  it("links job preferences to the live Learner settings instead of a removed profile tab", () => {
    const rules = source("src/app/(authenticated)/learn/my-placements/rules/page.tsx");
    const target = source("src/components/placements/learner-placement-preferences.tsx");
    expect(rules).toContain('href="/learn/my-placements#placement-job-preferences"');
    expect(target).toContain('id="placement-job-preferences"');
    expect(rules).not.toContain("/learn/profile#job-preferences");
  });
});
