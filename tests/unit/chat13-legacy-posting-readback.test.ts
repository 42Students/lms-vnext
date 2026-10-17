import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx","utf8");
describe("Super Admin supplemental draft terms",()=>{
 it("SA-placements-projects-14 shows persisted responsibilities assessment dates and custom rules",()=>{
  for(const label of ["legacyPostingDetails","Responsibilities","Assessment URL","Assessment deadline (IST)",
   "Important dates","Custom eligibility rules (informational)"])expect(page).toContain(label);
  expect(page).toContain("timeZone:\"Asia/Kolkata\"");
  expect(page).toContain("enforceable learner eligibility remains in the drive policy");
 });
});
