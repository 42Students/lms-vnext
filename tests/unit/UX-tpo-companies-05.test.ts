import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-05",()=>{
 it("renders one responsive company directory with actions and every persisted statistic",()=>{
  // Directory now uses the shared responsive Quartz spreadsheet rather than
  // two competing hand-built HTML table layouts.
  expect(source).toContain("<TpoCompaniesSpreadsheet rows={page.items}/>");
  const grid=readFileSync(new URL("../../src/components/tpo/tpo-companies-spreadsheet.tsx",import.meta.url),"utf8");
  expect(grid).toContain("<GridWorkspace");
  expect(grid).toContain("<TpoGrid");
  for(const label of ["Contacts","Drives","Offers","Accepted","Confirmed joins","CRM name only · not linked"])
   expect(grid).toContain(label);
  expect(source).toContain("Create drive");
  expect(source).not.toContain("<table");
 });
});
