import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-4 college company identity",()=>{
 it("COL-placements-R02 distinguishes platform verification, college trust and archived employer cues",()=>{
  const service=source("src/modules/placements/college-company-directory-service.ts");
  const view=source("src/components/placements/placement-employer-relationships.tsx");
  const page=source("src/app/(authenticated)/college/companies/page.tsx");
  expect(service).toContain("verifiedAt:placementCompanies.verifiedAt");
  expect(service).toContain("industry:placementCompanies.industry");
  expect(view).toContain("Verified by 42");
  expect(view).toContain("Deleted");
  expect(view).toContain("Domains:");
  expect(view).toContain("A company is kept once across colleges by its website or company email domain");
  expect(page).toContain("verifiedAt:item.verifiedAt");
  expect(view).toContain("Trusted employer relationship");
 });
});
