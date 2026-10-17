import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const lead=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
const detail=readFileSync("src/components/tpo/recruiter-lead-detail-workspace.tsx","utf8");
describe("TPO recruiter duplicate and opt-out safeguards",()=>{
 it("TPO-recruiters-22 checks both provided contact methods and links the actual existing lead",()=>{
  expect(lead).toContain('const contacts=[...new Set([form.email.trim(),form.phone.trim()].filter(Boolean))]');
  expect(lead).toContain('for(const contact of contacts)');
  expect(lead).toContain('setDuplicate(data.lead)');
  expect(lead).toContain('href={"/tpo/recruiters/" + duplicate.id}');
  expect(lead).toContain('disabled={saving || checking || Boolean(duplicate)}');
 });
 it("TPO-recruiters-R06 shows the exact opt-out/not-hiring explanation and blocks invitation",()=>{
  expect(detail).toContain("This person said they are not hiring from your college this season or unsubscribed.");
  expect(detail).toContain('lead.unsubscribedAt||lead.manualStage==="NOT_NOW"');
  expect(detail).toContain('Boolean(lead.unsubscribedAt)');
 });
});
