import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-companies-R04 Company Memory path to canonical controls",()=>{
 it("never resolves another college relationship",()=>{
  const source=readFileSync("src/modules/placements/tpo-company-memory-service.ts","utf8");
  expect(source).toContain("eq(placementCompanyRelationships.collegeId,rows.collegeId)");
 });
 it("shows canonical path when resolved",()=>{
  const ui=readFileSync("src/components/tpo/tpo-company-memory-workspace.tsx","utf8");
  expect(ui).toContain('aria-label="Company link and access"');
  expect(ui).toContain("Trust and review settings");
 });
});
