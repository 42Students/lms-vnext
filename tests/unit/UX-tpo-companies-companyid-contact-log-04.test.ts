import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-companyid-contact-log-04",()=>{
 it("uses shared controls in existing authorized GET workflow",()=>{
  expect(source).toContain("<Select");
  expect(source).toContain("<Button");
  expect(source).toContain('method="get"');
  expect(source).toContain("<PageHeader");
 });
});
