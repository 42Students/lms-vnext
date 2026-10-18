import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { summarizeVisibleCompanyDriveHistory } from "@/modules/placements/admin-company-drive-history-model";

describe("SA-COMPANY-HISTORY-04 scoped visible company-history aggregates", () => {
  it("returns zero for empty history and stable page-only totals for 500 displayable drives", () => {
    expect(summarizeVisibleCompanyDriveHistory([])).toEqual({drives:0,applicants:0,hired:0});
    const visible=Array.from({length:500},(_,i)=>({applicants: i%2, hired: i%5===0?1:0}));
    const original=visible.map(row=>({...row}));
    expect(summarizeVisibleCompanyDriveHistory(visible)).toEqual({
      drives:500, applicants:250, hired:100,
    });
    expect(visible).toEqual(original);
    // The 501st row probes for truncation and is never included in displayed totals.
    const extra=[...visible,{applicants:9000,hired:9000}];
    expect(summarizeVisibleCompanyDriveHistory(extra.slice(0,500))).toEqual({
      drives:500, applicants:250, hired:100,
    });
  });

  it("keeps selected-college candidate joins and explicitly distinguishes displayed totals from complete history", () => {
    const service=readFileSync("src/modules/placements/admin-company-drive-history-service.ts","utf8");
    const page=readFileSync("src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx","utf8");
    expect(service).toContain(".limit(501)");
    expect(service).toContain("const visibleJobs=jobs.slice(0,500)");
    expect(service).toContain("totals:summarizeVisibleCompanyDriveHistory(items)");
    expect(service).toContain("truncated:jobs.length>500");
    expect(service).toContain("eq(placementCompanyRelationships.collegeId, acting.collegeId)");
    expect(service).toContain("eq(placementJobs.collegeId, acting.collegeId)");
    expect(service).toContain("eq(collegeMemberships.collegeId,acting.collegeId)");
    expect(page).toContain("Showing first 500 drives. More historical records may exist.");
    expect(page).toContain("Totals above cover the displayed drives only.");
  });
});
