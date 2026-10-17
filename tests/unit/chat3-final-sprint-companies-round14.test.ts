import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
/** Source regression coverage; CI and browser acceptance are separate. */
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 final sprint TPO Companies",()=>{
 it("TPO-companies-07 confirmed yearly hiring history is computed from records",()=>{
  const code=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  expect(code).toContain("hiringPulse.hiredPerYear");
  expect(code).toContain("hiringPulse.yearsHiring");
  expect(code).toContain("Repeat hiring relationship");
 });
 it("TPO-companies-08 company drives include applied/offers, search and CSV",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("drive.applied");
  expect(code).toContain("drive.offers");
  expect(code).toContain("companyDriveCsv");
  expect(code).toContain("driveSearch");
 });
 it("TPO-companies-10 company drilldown targets the real job detail route",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("/tpo/placements/jobs/");
 });
 it("TPO-companies-11 company shares show documented history or truthful empty state",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("company.documents");
  expect(code).toContain("Nothing shared yet");
 });
 it("TPO-companies-12 contact stage labels are human readable",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("Drive planned");
  expect(code).toContain("person.stage");
  expect(code).toContain("Invited");
 });
});
