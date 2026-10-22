import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(path,"utf8");
describe("Final sprint recruiter calendar and inbox parity — group A",()=>{
 it("REC-calendar-messages-profile-03 shows scheduled start and end in IST when available",()=>{
  const calendar=read("src/app/(authenticated)/hr/calendar/page.tsx");
  const service=read("src/modules/placements/recruiter-calendar-service.ts");
  expect(calendar).toContain('event.endsAt?<span>– <time dateTime={event.endsAt.toISOString()}>{eventTime(event.endsAt)} IST</time>');
  expect(calendar).toContain('timeZone: "Asia/Kolkata"');
  expect(service).toContain("durationMinutes: placementJobRounds.durationMinutes");
 });
 it("REC-calendar-messages-profile-05 uses recruiter calendar legacy subtitle and accessible week navigation",()=>{
  const calendar=read("src/app/(authenticated)/hr/calendar/page.tsx");
  expect(calendar).toContain("Rounds, interview slots, deadlines and results due, for your drives at this college.");
  expect(calendar).toContain('"Previous week"');
  expect(calendar).toContain('"Next week"');
  expect(calendar).toContain("Nothing scheduled this week");
  expect(calendar).toContain("Rounds, slots and deadlines appear here as soon as they are dated.");
 });
 it("REC-calendar-messages-profile-06 shows per-event college identity in multi-college calendar",()=>{
  const calendar=read("src/app/(authenticated)/hr/calendar/page.tsx");
  const service=read("src/modules/placements/recruiter-calendar-service.ts");
  expect(service).toContain("collegeName: row.collegeName");
  expect(calendar).toContain('{event.companyName} · College: {event.collegeName}');
 });
 it("REC-calendar-messages-profile-07 sends rounds to Rounds and deadlines to drive Overview",()=>{
  const calendar=read("src/app/(authenticated)/hr/calendar/page.tsx");
  expect(calendar).toContain('event.kind==="ROUND"||event.kind==="INTERVIEW_SLOT"');
  expect(calendar).toContain('"?tab=rounds"');
  expect(calendar).toContain('"?tab=overview"');
  expect(calendar).toContain("encodeURIComponent(event.jobId)");
 });
 it("REC-calendar-messages-profile-09 keeps unread and conversation count, general-chat summary and search copy",()=>{
  const inbox=read("src/app/(authenticated)/hr/conversations/page.tsx");
  expect(inbox).toContain('result.unreadTotal+" unread message"');
  expect(inbox).toContain("Conversations with the placement cell, one per drive, plus a general one.");
  expect(inbox).toContain('result.total.toLocaleString("en-IN")+" conversation"');
  expect(inbox).toContain('Showing {result.first.toLocaleString("en-IN")}');
  expect(inbox).toContain("Search by drive or message");
  expect(inbox).toContain('name="q"');
 });
});