import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const file=(p:string)=>readFileSync(p,"utf8");
describe("College Placements additional UNCONFIRMED decisions",()=>{
 it("COL-placements-03 keeps offer issuance authoritative and link-based evidence scoped",()=>{
  expect(file("src/components/placements/placement-drive-workspace.tsx")).toContain("PlacementOfferControls");
  expect(file("src/components/placements/placement-offer-controls.tsx")).toContain("isTpo");
  expect(file("docs/audit/owner-decisions-resolved.md")).toContain("links only until uploads");
  expect(file("docs/audit/acceptance/college-placements-verification.md")).toContain("COL-placements-03 | OPEN (decided");
 });
 it("COL-placements-15 does not delete a company identity or silently restore a global company",()=>{
  const service=file("src/modules/placements/company-service.ts");
  const directory=file("src/modules/placements/college-company-directory-service.ts");
  expect(service).toContain("archivePlacementCompanyRelationship");
  expect(service).toContain('status: "ARCHIVED"');
  expect(directory).toContain('eq(placementCompanyRelationships.status,"ACTIVE")');
  expect(file("docs/audit/acceptance/college-placements-verification.md")).toContain("COL-placements-15 | OPEN (decided");
 });
});
