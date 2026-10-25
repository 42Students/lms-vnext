import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Final sprint recruiter calendar verification",()=>{
 it("REC-calendar-messages-profile-03 includes actual round end and duration evidence rather than guessing a one-hour event",()=>{
  const calendar=src("src/app/(authenticated)/hr/calendar/page.tsx");
  const service=src("src/modules/placements/recruiter-calendar-service.ts");
  expect(service).toContain("durationMinutes: placementJobRounds.durationMinutes");
  expect(calendar).toContain("event.endsAt");
  expect(calendar).toContain("eventTime(event.endsAt)");
  expect(calendar).toContain('timeZone: "Asia/Kolkata"');
 });
 it("REC-calendar-messages-profile-05 shows the legacy range, navigation and empty calendar wording",()=>{
  const page=src("src/app/(authenticated)/hr/calendar/page.tsx");
  expect(page).toContain("Rounds, interview slots, deadlines and results due, for your drives at this college.");
  expect(page).toContain('"Previous week"');
  expect(page).toContain('"Next week"');
  expect(page).toContain("Nothing scheduled this week");
  expect(page).toContain("Rounds, slots and deadlines appear here as soon as they are dated.");
 });
 it("REC-calendar-messages-profile-06 identifies the college for every multi-college calendar event",()=>{
  const page=src("src/app/(authenticated)/hr/calendar/page.tsx");
  const service=src("src/modules/placements/recruiter-calendar-service.ts");
  expect(page).toContain("College: {event.collegeName}");
  expect(service).toContain("collegeName: row.collegeName");
  expect(service).toContain("placements.recruiter.read");
 });
 it("REC-calendar-messages-profile-07 sends deadlines to Overview and interview/round events to scoped Rounds tab",()=>{
  const page=src("src/app/(authenticated)/hr/calendar/page.tsx");
  expect(page).toContain('event.kind==="ROUND"||event.kind==="INTERVIEW_SLOT"');
  expect(page).toContain('?tab=rounds');
  expect(page).toContain('?tab=overview');
  expect(page).toContain("encodeURIComponent(event.jobId)");
 });
 it("REC-calendar-messages-profile-03 independent final-sprint acceptance regression",()=>{
  const model=src("src/modules/placements/recruiter-calendar-model.ts");
  expect(model).toContain("endsAt: recruiterRoundEndTime(round.scheduledAt, round.durationMinutes)");
  expect(model).toContain("return new Date(start.getTime() + durationMinutes * 60_000)");
  expect(model).toContain("durationMinutes <= 0 || durationMinutes > 24 * 60");
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("eventTime(event.endsAt)");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-03 |");
 });

 it("REC-calendar-messages-profile-05 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("view===\"week\"?\"Nothing scheduled this week\"");
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("Rounds, slots and deadlines appear here as soon as they are dated.");
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("\"Next week\"");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-05 |");
 });

 it("REC-calendar-messages-profile-06 independent final-sprint acceptance regression",()=>{
  expect(src("src/modules/placements/recruiter-calendar-model.ts")).toContain("collegeName: job.collegeName ?? null");
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("College: {event.collegeName}");
  expect(src("src/modules/placements/recruiter-calendar-service.ts")).toContain("collegeName: row.collegeName");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-06 |");
 });

 it("REC-calendar-messages-profile-07 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("roundEvent?\"?tab=rounds\"");
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("?\"?tab=rounds\"");
  expect(src("src/app/(authenticated)/hr/calendar/page.tsx")).toContain("?tab=overview\"");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-07 |");
 });

});