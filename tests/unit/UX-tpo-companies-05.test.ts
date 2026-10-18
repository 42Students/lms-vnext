import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-05",()=>{
 it("renders one responsive company directory with actions and every persisted statistic",()=>{
  expect(source).toContain("<DataTable");
  expect(source).toContain("rows={page.items}");
  expect(source).toContain("empty={<p");
  expect(source).toContain('mobilePriority:"action"');
  for(const label of ["Contacts","Drives","Offers","Accepted","Confirmed joins","Create drive","CRM name only · not linked"])expect(source).toContain(label);
  expect(source).not.toContain("<table");
 });
});
