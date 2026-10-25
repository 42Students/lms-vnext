import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const load=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Google Calendar draft-to-Meet contract",()=>{
 const service=load("src/modules/projects/mentor-google-meeting-sync-service.ts");
 const page=load("src/components/projects/mentor-meetings-calendar.tsx");
 const control=load("src/components/projects/mentor-google-meeting-sync-controls.tsx");
 it("restricts scheduling to a returned provider Meet link under a project lock",()=>{
  expect(service).toContain('const draft=meeting.status==="DRAFT"');
  expect(service).toContain('if(draft&&!event.meetUrl)');
  expect(service).toContain('meetingScheduled:false');
  expect(service).toContain('invitationStatus:"NOT_SENT"');
  expect(service).toContain('.for("update").limit(1)');
  expect(service).toContain('PROJECT_MEETING_STALE_VERSION');
  expect(service).toContain('PROJECT_MEETING_SCHEDULE_CONFLICT');
  expect(service).toContain('scheduledByMembershipId:context.membership!.id');
  expect(service).toContain('status:"SCHEDULED",meetingUrl:event.meetUrl!');
 });
 it("does not externally invite an unpublished draft",()=>{
  expect(service).toContain("inviteeEmails:draft?[]:invitees");
  expect(service).toContain('if(draft){\n  try{');
  expect(service).toContain('invitationStatus="RETRY_REQUIRED"');
  expect(service).toContain('roles:["LEARNER"]');
  expect(service).toContain('roles:["MENTOR"]');
 });
 it("makes draft generation reachable with truthful partial state",()=>{
  expect(page).toContain('["DRAFT","SCHEDULED","RESCHEDULED","CANCELLED"].includes(meeting.status)');
  expect(page).toContain('cancelled={meeting.status==="CANCELLED"}');
  expect(page).toContain('draft={meeting.status==="DRAFT"}');
  expect(control).toContain("Generate Meet link and schedule");
  expect(control).toContain("no invitations were requested");
  expect(control).toContain("invitationStatus");
 });
});
