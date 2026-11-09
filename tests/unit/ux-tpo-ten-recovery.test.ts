import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const base = "src/app/(authenticated)/tpo/";
const cases = [
  ["UX-G098","batches/error.tsx","/tpo/home"],
  ["UX-G099","batches/[batchId]/history/error.tsx","/tpo/batches"],
  ["UX-G100","calendar/error.tsx","/tpo/home"],
  ["UX-G101","calendar/interviews/error.tsx","/tpo/calendar"],
  ["UX-G102","companies/[companyId]/people/error.tsx","/tpo/companies"],
  ["UX-G104","messages/error.tsx","/tpo/home"],
  ["UX-G105","placements/jobs/[jobId]/applicants-pipeline/error.tsx","/tpo/placements"],
  ["UX-G106","placements/jobs/[jobId]/close-preview/error.tsx","/tpo/placements"],
  ["UX-G107","placements/jobs/[jobId]/joining/error.tsx","/tpo/placements"],
  ["UX-G108","placements/jobs/[jobId]/offers/[offerId]/error.tsx","/tpo/placements"],
] as const;
const read = (p:string)=>readFileSync(p,"utf8");

describe("Ten-group TPO recovery, 173 registered surfaces", () => {
  it.each(cases)("%s preserves retry and offers an explicit safe fallback", (_group,path,href) => {
    const s=read(base+path);
    expect(s).toContain("onClick={reset}");
    expect(s).toContain('href="'+href+'"');
    expect(s).not.toContain("error.message");
    expect(s).not.toContain("error.digest");
    expect(s).toContain("min-h-11");
  });
  it("does not turn placement read failure into a false zero or applied mutation", () => {
    expect(read(base+"batches/error.tsx")).toContain("No eligibility decisions were changed");
    expect(read(base+"placements/jobs/[jobId]/close-preview/error.tsx")).toContain("No close action was applied");
    expect(read(base+"placements/jobs/[jobId]/offers/[offerId]/error.tsx")).toContain("Could not load offer evidence");
  });
  it("development preview cannot expose real tenant records or ship enabled", () => {
    const page=read("src/app/e2e/ux-tpo-ten-recovery/page.tsx");
    expect(page).toContain('process.env.NODE_ENV !== "development"');
    expect(page).toContain('process.env["UX_TPO_TEN_FIXTURE"] !== "1"');
    expect(page).toContain("notFound()");
    const h=read("src/app/e2e/ux-tpo-ten-recovery/tpo-ten-recovery-harness.tsx");
    expect(h).not.toContain("getCurrentRequestContext");
    expect(h).not.toContain("fetch(");
    expect(h).not.toContain("database");
  });
  it("retains role checks before batch, company and placement workspaces", () => {
    for (const p of ["batches/page.tsx","companies/page.tsx","placements/lifecycle/page.tsx"]) {
      const s=read(base+p);
      expect(s).toContain("getCurrentRequestContext");
      expect(s.includes("hasMembershipRole") || s.includes("requireTpoBatchActor") || s.includes("requirePersistedTpoMembership") || s.includes('can(context,"placements.manage"')).toBe(true);
    }
  });
  it("rejects duplicate URL keys on all five authenticated production page families",()=>{
    expect(read(base+"home/page.tsx")).toContain("Array.isArray(routeQuery.seasonId)");
    expect(read(base+"batches/page.tsx")).toContain("scalarKeys.some(key=>Array.isArray(raw[key]))");
    expect(read(base+"calendar/page.tsx")).toContain("repeatedFilter=Object.values(raw).some(Array.isArray)");
    expect(read(base+"calendar/page.tsx")).toContain("repeatedFilter||!parsed.success");
    expect(read(base+"calendar/interviews/page.tsx")).toContain("Object.values(query).some(Array.isArray)");
    expect(read(base+"calendar/interviews/page.tsx")).toContain("No interview data was queried");
    expect(read(base+"companies/page.tsx")).toContain("!tpoCompanyFiltersShapeValid(raw)");
  });

});
