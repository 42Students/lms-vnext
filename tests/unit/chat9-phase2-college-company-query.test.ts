import {describe,expect,it} from "vitest";
import {parseCollegeCompaniesQuery,collegeCompaniesHref,literalCompanySearch,COLLEGE_COMPANIES_PAGE_SIZE} from "@/modules/placements/college-company-directory-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("college company search and pagination",()=>{
  it("validates a strict bounded URL and protects literal wildcard searches",()=>{
    expect(parseCollegeCompaniesQuery({q:"  Acme ",page:"2"})).toMatchObject({success:true});
    expect(parseCollegeCompaniesQuery({q:["a","b"]}).success).toBe(false);
    expect(parseCollegeCompaniesQuery({collegeId:"foreign"}).success).toBe(false);
    expect(literalCompanySearch("A_B%")).toBe("%A\\_B\\%%");
    expect(collegeCompaniesHref({q:"Acme",page:2,pageSize:10,sort:"LAST_ACTIVE",showDeleted:"0"} as never)).toContain("q=Acme&page=2");
    expect(COLLEGE_COMPANIES_PAGE_SIZE).toBe(25);
  });
  it("counts and pages in SQL after the persisted college role check",()=>{
    const src=readFileSync(join(process.cwd(),
      "src/modules/placements/college-company-directory-service.ts"),"utf8");
    expect(src).toContain("requireCollegePlacementAdmin(context)");
    expect(src).toContain('eq(placementCompanyRelationships.collegeId,collegeId)');
    expect(src).toContain(".limit(COLLEGE_COMPANIES_PAGE_SIZE)");
    expect(src).toContain("literalCompanySearch(query.q)");
    expect(src).not.toContain("context.adminScope");
  });
});
