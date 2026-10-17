import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("TPO recruiter editor duplicate conflict recovery",()=>{
 it("TPO-recruiters-30 preserves edit values and links the college-scoped duplicate lead on 409",()=>{
  const ui=source("src/components/tpo/recruiter-lead-detail-workspace.tsx");
  const endpoint=source("src/app/api/placements/tpo/leads/check/route.ts");
  expect(ui).toContain("const [duplicateLead,setDuplicateLead]");
  expect(ui).toContain('cause.message.startsWith("Another recruiter already")');
  expect(ui).toContain("url===base&&method===\"PATCH\"");
  expect(ui).toContain("encodeURIComponent(collegeId)");
  expect(ui).toContain("encodeURIComponent(contact)");
  expect(ui).toContain("value.lead.id!==leadId");
  expect(ui).toContain("setDuplicateLead(value.lead)");
  expect(ui).toContain("Contact already exists:");
  expect(ui).toContain('className="font-semibold text-primary-text underline">Open {duplicateLead.name}');
  expect(ui).toContain("return false;");
  expect(endpoint).toContain("checkTpoLeadContact(context");
 });
});