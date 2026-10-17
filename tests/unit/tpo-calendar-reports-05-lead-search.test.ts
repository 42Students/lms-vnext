import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {searchTpoCalendarLeads} from "@/modules/placements/tpo-calendar-lead-search-model";
describe("TPO-calendar-reports-05 searchable picker across all leads",()=>{
 const leads=Array.from({length:160},(_,i)=>({
  id:String(i),name:"Recruiter "+i,companyName:i===155?"Rare Corp":null,
  emailNorm:i===157?"older@example.com":null,
 }));
 it("searches beyond first 100 and by company and email",()=>{
  expect(searchTpoCalendarLeads(leads,"rare").map(x=>x.id)).toEqual(["155"]);
  expect(searchTpoCalendarLeads(leads,"older@").map(x=>x.id)).toEqual(["157"]);
  expect(searchTpoCalendarLeads(leads,"r")).toEqual([]);
  expect(searchTpoCalendarLeads(leads,"recruiter").length).toBe(30);
 });
 it("no longer truncates authorized source and wires selected lead to POST",()=>{
  const page=readFileSync("src/components/placements/placement-calendar-workspace.tsx","utf8");
  const client=readFileSync("src/components/placements/tpo-calendar-followup-actions.tsx","utf8");
  expect(page).not.toContain("recruiterLeads.slice(0, 100)");
  expect(page).toContain("<TpoNewFollowupModal");
  expect(client).toContain("lead.email");
  expect(client).toContain(".slice(0, 50)");
  expect(client).toContain('leadId: String(data.get("leadId")');
 });
});
