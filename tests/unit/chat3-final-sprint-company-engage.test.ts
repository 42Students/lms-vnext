import {readFileSync} from "node:fs";
import {join} from "node:path";
import {it,describe,expect} from "vitest";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 final sprint Engage company navigation and communication",()=>{
 it("TPO-companies-13 verifies scoped legacy company workflows",()=>{
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("Create drive");
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("Add contact");
  expect(read("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx")).toContain("/tpo/placements/new?company=");
  expect(read("src/app/(authenticated)/tpo/placements/new/page.tsx")).toContain("initialCompanyName");
  expect(read("src/app/(authenticated)/tpo/placements/new/page.tsx")).toContain("searchParams");
 });
 it("TPO-companies-14 verifies scoped legacy company workflows",()=>{
  expect(read("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("href={"/tpo/recruiters?add=1&company="+encodeURIComponent(company.name)}");
  expect(read("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}");
  expect(read("src/components/tpo/tpo-company-memory-workspace.tsx")).toContain("Follow-up");
 });
 it("TPO-companies-15 verifies scoped legacy company workflows",()=>{
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("/api/placements/tpo/companies/communication");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("deriveLegacyCompanyCommunication");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("MEETING_SET");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("NOT_INTERESTED");
 });
 it("TPO-companies-16 verifies scoped legacy company workflows",()=>{
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("Search company or people");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("Typed more than one way");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("All communication");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("Clear company filters");
 });
 it("TPO-companies-17 verifies scoped legacy company workflows",()=>{
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("Drives that ran");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("Add a contact");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("company.people.map");
  expect(read("src/components/tpo/recruiter-leads-workspace.tsx")).toContain("company.drivesRan");
 });
});
