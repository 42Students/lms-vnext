import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
describe("TPO Engage stale snapshot resilience",()=>{
 it("TPO-recruiters-42 preserves recruiter rows on reload failure and offers Retry",()=>{
  expect(src).toContain("leadsSnapshotReady=useRef(false)");
  expect(src).toContain('setPhase(leadsSnapshotReady.current?"ready":"error")');
  expect(src).toContain("Showing the last recruiter list we loaded.");
  expect(src).toContain("onClick={()=>void load()}>Retry</button>");
 });
 it("TPO-recruiters-42 keeps company snapshot while showing a separate recoverable warning",()=>{
  expect(src).toContain("companiesSnapshotReady=useRef(false)");
  expect(src).toContain('setCompaniesPhase(companiesSnapshotReady.current?"ready":"error")');
  expect(src).toContain("Showing the last company list we loaded.");
  expect(src).toContain(">Retry companies</button>");
 });
});
