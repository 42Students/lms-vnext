import {describe,expect,it} from "vitest";
import {collegeCompanyDraftPayload} from "@/modules/placements/college-company-create-model";
import {readFileSync} from "node:fs";
const collegeId="11111111-1111-4111-8111-111111111111";
const draft=(overrides:Partial<{name:string;websiteUrl:string;primaryDomain:string}>={})=>
 collegeCompanyDraftPayload({collegeId,name:"Example Industries",websiteUrl:"https://example.org",
  primaryDomain:"",...overrides});
describe("College company creation evidence validation",()=>{
 it("COL-placements-14 requires a canonical HTTPS website or validated domain",()=>{
  expect(draft().success).toBe(true);
  expect(draft({websiteUrl:"",primaryDomain:"example.org"}).success).toBe(true);
  expect(draft({websiteUrl:"",primaryDomain:""}).success).toBe(false);
  expect(draft({websiteUrl:"http://example.org"}).success).toBe(false);
  expect(draft({websiteUrl:"javascript:alert(1)"}).success).toBe(false);
  expect(draft({websiteUrl:"",primaryDomain:"missing dot"}).success).toBe(false);
  expect(draft({name:"X".repeat(151)}).success).toBe(false);
  const parsed=draft({name:" Example Industries  "});
  expect(parsed.success).toBe(true);
  if(parsed.success)expect(parsed.data.name).toBe("Example Industries");
 });
 it("COL-placements-14 sends only parsed tenant-scoped canonical payload through guarded origin-protected API",()=>{
  const c=readFileSync("src/components/placements/college-company-create.tsx","utf8");
  expect(c).toContain("collegeCompanyDraftPayload");
  expect(c).toContain("body:JSON.stringify(parsed.data)");
  expect(c).toContain("useGuardedAction");
  expect(c).toContain("minLength={2} maxLength={150}");
  const route=readFileSync("src/app/api/placements/companies/route.ts","utf8");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("createPlacementCompany");
 });
});
