import {describe,expect,it} from "vitest";
import {superAdminCompanyCsv} from "@/modules/placements/admin-company-directory-export-model";
describe("Super Admin employer CSV",()=>{
 it("prevents formulas, quotes and newlines from breaking the scoped rows",()=>{
  const csv=superAdminCompanyCsv([{relationshipId:"r",companyId:"c",collegeId:"a",organizationId:"o",name:"=SUM(1,1)",collegeName:'College "A"',companyStatus:"ACTIVE",relationshipStatus:"ACTIVE",trusted:true,website:"https://example.org"}]);
  expect(csv).toContain("'=SUM(1,1)");
  expect(csv).toContain('College ""A""');
  expect(csv).not.toContain("email");
  expect(csv).toContain(String.fromCharCode(13,10));
  expect(csv).not.toContain(String.raw`\\r\\n`);
 });
});
