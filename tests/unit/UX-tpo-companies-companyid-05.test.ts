import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/[companyId]/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-companyid-05",()=>{
 it("uses single-tree responsive drive and offer history with legacy labels",()=>{
  expect(source.match(/<DataTable\b/g)).toHaveLength(2);
  expect(source).toContain("rows={drives}");
  expect(source).toContain("rows={hiringHistory}");
  expect(source).toContain("No placement drives are recorded for this company.");
  expect(source).toContain("No placement offers are recorded for this company.");
  expect(source).toContain("Confirmed joins");
  expect(source).toContain('mobilePriority:"action"');
  expect(source).not.toContain("<table");
 });
});
