import { describe, expect, it } from "vitest";
import { COLLEGE_LEGACY_GROUPS, collegeLegacyGroupForPath } from "@/modules/people/college-legacy-tabs-model";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("legacy College Admin Companies route and scope",()=>{
  it("restores the Companies tab next to Drives in legacy order",()=>{
    const tabs=COLLEGE_LEGACY_GROUPS.find(group=>group.title==="Placements")?.tabs;
    expect(tabs?.map(tab=>tab.label)).toEqual(["Drives","Companies","Interviews","Analytics"]);
    expect(collegeLegacyGroupForPath("/college/companies")?.title).toBe("Placements");
  });
  it("keeps the page on the college-scoped service with a college-role guard",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/app/(authenticated)/college/companies/page.tsx"),"utf8");
    expect(source).toContain('hasMembershipRole(context,"COLLEGE_ADMIN")');
    expect(source).toContain("isSuperAdmin(context) ? context.adminScope?.collegeId : null");
    expect(source).toContain("listCollegeCompanyDirectory(context,query)");
    expect(source).toContain("listPlacementRelationshipOwners(context,collegeId)");
    expect(source).not.toContain("listSuperAdminCompanyDirectory");
    expect(source).not.toContain("listPlacementCompanies(context, collegeId)");
  });
});
