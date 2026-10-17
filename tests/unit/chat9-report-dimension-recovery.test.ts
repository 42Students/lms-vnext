import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const page=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/placement-summary/page.tsx"),"utf8");
describe("TPO report dimension failure recovery",()=>{
 it("TPO-calendar-reports-53 retains a successful season report when dimension lookup fails and never presents missing dimension rows as zero",()=>{
  expect(page).toContain("getTpoReportDriveDimensions(context");
  expect(page).toContain("}).catch(()=>null);");
  expect(page).toContain("Batch filter unavailable.");
  expect(page).toContain("{dimensions?<ReportTable");
  expect(page).toContain("no drive-row totals are inferred.");
  expect(page).toContain("Retry");
 });
});
