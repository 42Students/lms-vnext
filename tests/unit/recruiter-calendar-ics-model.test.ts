import {describe,expect,it} from "vitest";
import {recruiterCalendarIcs} from "@/modules/placements/recruiter-calendar-ics-model";
import type {PlacementCalendarEvent} from "@/modules/placements/placement-calendar-model";

const start=new Date("2026-10-26T05:30:00Z"),end=new Date("2026-10-26T06:30:00Z");
const base:PlacementCalendarEvent={
 id:"round:66000000-0000-4000-8000-000000000001",
 kind:"ROUND",startsAt:start,endsAt:end,
 title:"Technical interview",companyId:"a",companyName:"Company",
 jobId:"66000000-0000-4000-8000-000000000004",
 jobTitle:"Analyst",roundId:"66000000-0000-4000-8000-000000000001",
 roundKind:"INTERVIEW",leadId:null,followupId:null,
 status:"SCHEDULED",timezone:"Asia/Kolkata",venue:"Seminar Hall",
 note:null,completedAt:null,
};
const at=new Date("2026-10-25T12:00:00Z");
describe("Recruiter screenshot 09: verified ICS calendar",()=>{
 it("exports only nonprivate authorized round, slot and results due facts",()=>{
  const result=recruiterCalendarIcs([base],[{id:"d1",jobId:base.jobId!,jobTitle:"Analyst",roundName:"HR",dueAt:end}],at);
  expect(result.included).toBe(2);
  expect(result.ics).toContain("BEGIN:VCALENDAR\r\nVERSION:2.0");
  expect(result.ics).toContain("DTSTART:20261026T053000Z");
  expect(result.ics).toContain("DTEND:20261026T063000Z");
  expect(result.ics).toContain("SUMMARY:Send results");
  expect(result.ics).not.toContain("student@");
 });
 it("sanitizes newlines, commas and semicolons, even in college-provided text",()=>{
  const result=recruiterCalendarIcs([{...base,title:"A;B, C\r\nX-PROBE:INJECTED"}],[],at);
  expect(result.ics).toContain("A\\;B\\, C\\nX-PROBE:INJECTED");
  expect(result.ics).not.toMatch(/\r\nX-PROBE:/);
  expect(result.included).toBe(1);
 });
 it("folds physical lines at most 75 UTF-8 octets and never splits a glyph",()=>{
  const r=recruiterCalendarIcs([{...base,title:"साक्षात्कार".repeat(36)}],[],at);
  for(const line of r.ics.split("\r\n")){
   expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  }
 });
 it("keeps duplicates and malformed times out, caps export even on large source",()=>{
  const dates=Array.from({length:330},(_,i)=>({...base,id:"round:"+i}));
  const r=recruiterCalendarIcs([...dates,{...base,id:"broken",startsAt:new Date("invalid")}],[],at);
  expect(r.included).toBe(300);
  expect(r.truncated).toBe(true);
  expect(r.ics.match(/BEGIN:VEVENT/g) ?? []).toHaveLength(300);
  expect(recruiterCalendarIcs([base,base],[],at).included).toBe(1);
 });
 it("fails closed on malformed export clock",()=>{
  expect(()=>recruiterCalendarIcs([base],[],new Date(NaN))).toThrow(/Invalid export timestamp/);
 });
});
