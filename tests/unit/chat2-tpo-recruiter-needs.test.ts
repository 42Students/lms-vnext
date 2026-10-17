import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const page=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
describe("TPO Engage legacy Needs doing",()=>{
 it("TPO-recruiters-07 shows only real nonzero legacy attention categories and count",()=>{
  for(const phrase of ["Follow-ups due","No next step","Gone quiet","Unassigned","Nothing right now.","recruiters with access"])
   expect(page).toContain(phrase);
  expect(page).toContain('["QUIET","Gone quiet"');
  expect(page).toContain('.filter(([, ,count])=>count>0)');
  expect(page).toContain('href="/tpo/settings/recruiters"');
 });
 it("TPO-recruiters-39 preserves the legacy first-run empty help text",()=>{
  expect(page).toContain("No recruiters yet. Add a company contact to start tracking outreach.");
  expect(page).toContain("Add recruiter lead");
 });
});
