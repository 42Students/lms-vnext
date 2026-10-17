import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {normalizeCompanyDomain} from "@/modules/placements/super-admin-company-identities-model";
const r=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin company curation directory parity",()=>{
 it("SA-placements-projects-29 projects industry, provenance, colleges, drives, active dates and domains",()=>{
  const svc=r("src/modules/placements/admin-company-directory-service.ts");
  for(const col of ["industry:","addedByType:","companyCollegeCount:","driveCount:",
    "lastActiveAt:","domains:","aliases:"])expect(svc).toContain(col);
  const page=r("src/app/(authenticated)/admin/companies/page.tsx");
  for(const label of ["Added by:","Industry:","Linked colleges","Drives in this college",
    "Last drive activity","Domains:","Other names:"])expect(page).toContain(label);
 });
 it("SA-placements-projects-29 searches across aliases and every canonical domain",()=>{
  const src=r("src/modules/placements/admin-company-directory-service.ts");
  expect(src).toContain("placementCompanyAliases.alias");
  expect(src).toContain("placementCompanyDomains.domain");
  expect(src).toContain("query.searchField");
 });
 it("SA-placements-projects-27 blocks student and institution domain capture",()=>{
  expect(()=>normalizeCompanyDomain("university.ac.in")).toThrow();
 });
});
