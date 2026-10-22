import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-companyid-contact-log-05",()=>{
 it("uses one mobile-first shared DataTable with the original honest empty state",()=>{
  expect(source).toContain("<DataTable");
  expect(source).toContain("rows={log.rows}");
  expect(source).toContain("getRowKey={(row)=>row.id}");
  expect(source).toContain('empty={<EmptyState title="No recorded contact interactions match this filter."');
  expect(source).toContain("No recorded contact interactions match this filter.");
  expect(source).toContain("mobilePriority");
  expect(source).not.toContain("<table");
 });
});
