import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("42 Tracker reporter access security",()=>{
 it("SA-placements-projects-101 preserves approved authenticated reporter privacy boundary instead of anonymous listing",()=>{
  const audit=readFileSync("docs/audit/pages/superadmin/placements-projects-c-tracker.md","utf8");
  const decisions=readFileSync("docs/audit/owner-decisions-resolved.md","utf8");
  const issues=readFileSync("src/app/(authenticated)/tracker/issues/page.tsx","utf8");
  expect(audit).toContain("SA-placements-projects-101 — SKIP, owner decision OD-27");
  expect(decisions).toContain("OD-27");
  expect(issues).toContain('if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE") redirect');
 });
});