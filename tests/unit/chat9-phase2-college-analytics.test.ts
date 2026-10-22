import { describe, expect, it } from "vitest";
import { collegeHiringAnalyticsQuery } from "@/modules/placements/college-hiring-analytics-model";
import { COLLEGE_LEGACY_GROUPS, collegeLegacyGroupForPath } from "@/modules/people/college-legacy-tabs-model";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("legacy College Admin Analytics scope and URL",()=>{
  it("accepts only one precise season and job identifier",()=>{
    const id="7b515d51-4f53-4d09-a606-365c44cd77cb";
    expect(collegeHiringAnalyticsQuery({seasonId:id,jobId:id}).success).toBe(true);
    expect(collegeHiringAnalyticsQuery({seasonId:[id,id]}).success).toBe(false);
    expect(collegeHiringAnalyticsQuery({collegeId:id}).success).toBe(false);
    expect(collegeHiringAnalyticsQuery({seasonId:"other"}).success).toBe(false);
  });
  it("surfaces the legacy Analytics label without a Super Admin link",()=>{
    expect(COLLEGE_LEGACY_GROUPS[3]?.tabs.map(t=>t.label)).toEqual([
      "Drives","Companies","Interviews","Analytics",
    ]);
    expect(collegeLegacyGroupForPath("/college/hiring-dashboard")?.title).toBe("Placements");
  });
  it("requires the persisted membership college before calling the report service",()=>{
    const src=readFileSync(join(process.cwd(),
      "src/app/(authenticated)/college/hiring-dashboard/page.tsx"),"utf8");
    expect(src).toContain('hasMembershipRole(context, "COLLEGE_ADMIN")');
    expect(src).toContain("collegeId:context.membership.collegeId");
    expect(src).toContain("getPlacementReportWorkspace");
    expect(src).not.toContain("listSuperAdmin");
  });
});
