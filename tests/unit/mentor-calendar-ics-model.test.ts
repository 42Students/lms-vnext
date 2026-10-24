import {describe,expect,it} from "vitest";
import {buildMentorMeetingIcs,mentorIcsEscape,mentorIcsFold} from
  "@/modules/projects/mentor-calendar-ics-model";
import type {MentorMeetingCalendarItem} from
  "@/modules/projects/mentor-calendar-view";

const meeting=(override:Partial<MentorMeetingCalendarItem>={}):MentorMeetingCalendarItem=>({
 id:"11111111-1111-4111-8111-111111111111",
 projectId:"22222222-2222-4222-8222-222222222222",
 projectTitle:"Project 1",projectStatus:"ACTIVE",title:"Sprint Review",
 status:"SCHEDULED",startsAt:"2026-10-26T09:30:00+05:30",
 endsAt:"2026-10-26T10:30:00+05:30",timeZone:"Asia/Kolkata",
 meetingUrl:null,linkedSprintTitle:null,...override,
});
describe("Mentor RFC5545 ICS export",()=>{
 it("exports only valid confirmed real meetings with UTC timestamps",()=>{
  const content=buildMentorMeetingIcs([
   meeting(),meeting({id:"cancel",status:"CANCELLED"}),
   meeting({id:"request",status:"REQUESTED"}),
   meeting({id:"bad",startsAt:"invalid"}),
  ],new Date("2026-10-24T00:00:00Z"))!;
  expect(content).toContain("BEGIN:VCALENDAR\r\n");
  expect(content).toContain("DTSTART:20261026T040000Z");
  expect(content).toContain("DTEND:20261026T050000Z");
  expect(content).toContain("UID:11111111-1111-4111-8111-111111111111@42lms");
  expect(content.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(content.endsWith("\r\n")).toBe(true);
 });
 it("rejects exports of only requests, drafts or invalid durations",()=>{
  expect(buildMentorMeetingIcs([meeting({status:"DRAFT"})])).toBeNull();
  expect(buildMentorMeetingIcs([meeting({endsAt:"2026-10-26T03:00:00Z"})]))
   .toBeNull();
 });
 it("escapes CRLF header-injection and punctuation in title/description",()=>{
  const title="Agenda, minutes; confirm\r\nBEGIN:VEVENT";
  const content=buildMentorMeetingIcs([meeting({title,
   projectTitle:"Team\\Lead;Quality"})])!;
  expect(content.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(content).toContain("SUMMARY:Agenda\\, minutes\\; confirm\\nBEGIN:VEVENT");
  expect(mentorIcsEscape("a\\b")).toBe("a\\\\b");
 });
 it("folds long multilingual lines by UTF-8 byte count with continuation",()=>{
  const line="SUMMARY:"+("తెలుగు😊".repeat(35));
  const folded=mentorIcsFold(line);
  const segments=folded.split("\r\n");
  expect(segments.length).toBeGreaterThan(2);
  expect(segments.every(row=>new TextEncoder().encode(row).length<=75)).toBe(true);
  expect(segments.slice(1).every(row=>row.startsWith(" "))).toBe(true);
  expect(segments.map((row,index)=>index?row.slice(1):row).join("")).toBe(line);
 });
});
