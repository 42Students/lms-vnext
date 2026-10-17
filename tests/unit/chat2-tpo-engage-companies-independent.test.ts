import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
describe("TPO companies independent of recruiter lead filters",()=>{
 it("TPO-companies-19 retains Companies when the recruiter roster is empty or filtered",()=>{
  expect(src).toContain('view !== "companies" && visible.length === 0');
  expect(src).toContain(') : view === "companies" ? (');
  expect(src).toContain('visibleCompanies.map(company=>(');
  expect(src).toContain("No companies match the current filters.");
 });
 it("TPO-recruiters-R02 does not hide company-derived directory behind the lead empty state",()=>{
  expect(src).toContain('view !== "companies" && visible.length === 0');
  expect(src).toContain('view === "companies" ?');
  expect(src).toContain('href={"/tpo/companies?name="+encodeURIComponent(company.name)}');
  expect(src).toContain('companiesSnapshotReady.current=true');
 });
});
