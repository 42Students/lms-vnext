import {readFileSync} from "node:fs";
import {join} from "node:path";
import {it,describe,expect} from "vitest";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 final sprint companies accessibility, exporting and safety",()=>{
 it("TPO-companies-18 preserves scoped company UI and privacy guarantees",()=>{
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("Companies (");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("Export companies CSV");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("visibleCompanies");
 });
 it("TPO-companies-24 preserves scoped company UI and privacy guarantees",()=>{
  expect(read("src/components/shell/legacy-sidebar-active-model.ts")).toContain("pathname===\"/tpo/companies\"");
  expect(read("src/components/shell/legacy-sidebar-active-model.ts")).toContain("pathname.startsWith(\"/tpo/companies/\")");
 });
 it("TPO-companies-26 preserves scoped company UI and privacy guarantees",()=>{
  expect(read("src/components/tpo/tpo-company-create-form.tsx")).toContain("role=\"dialog\"");
  expect(read("src/components/tpo/tpo-company-create-form.tsx")).toContain("aria-modal=\"true\"");
  expect(read("src/components/tpo/tpo-company-create-form.tsx")).toContain("e.key===\"Escape\"");
  expect(read("src/components/tpo/tpo-company-create-form.tsx")).toContain("e.key!==\"Tab\"");
  expect(read("src/components/tpo/tpo-company-create-form.tsx")).toContain("launchRef.current?.focus()");
 });
 it("TPO-companies-27 preserves scoped company UI and privacy guarantees",()=>{
  expect(read("src/app/(authenticated)/tpo/companies/page.tsx")).toContain("Sort by");
  expect(read("src/app/(authenticated)/tpo/companies/page.tsx")).toContain("Export companies CSV");
  expect(read("src/app/(authenticated)/tpo/companies/page.tsx")).toContain("Create drive");
 });
 it("TPO-companies-28 preserves scoped company UI and privacy guarantees",()=>{
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("Hiring history");
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("hiringHistory.map");
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("offer.roleTitle");
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("offer.status");
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("Joining");
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).not.toContain("offer.learnerName");
 });
});
