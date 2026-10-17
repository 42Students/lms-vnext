import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
describe("Engage attention and legacy counters",()=>{
 it("TPO-recruiters-07 allows Needs doing strip to collapse without losing the active filters",()=>{
  expect(src).toContain("setNeedsExpanded(open=>!open)");
  expect(src).toContain("aria-expanded={needsExpanded}");
  expect(src).toContain("Follow-ups due");
  expect(src).toContain("No next step");
  expect(src).toContain("Gone quiet");
  expect(src).toContain("Nothing right now.");
  expect(src).toContain("recruiters with access");
 });
});
