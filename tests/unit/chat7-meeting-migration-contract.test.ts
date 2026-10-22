import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {mentorMeetingFacilitationSchema,emptyMentorMeetingFacilitation}
  from "@/modules/projects/mentor-meeting-facilitation-model";

const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

describe("MEN-projects-meetings-27 migration and schema parity",()=>{
 const schema=read("src/db/schema/projects.ts");
 const proposal=read("docs/proposed-migrations/registered-0135/chat7-mentor-meeting-facilitation.sql");
 it("MEN-projects-meetings-27 registers the same facilitation object check in SQL and Drizzle",()=>{
  expect(schema).toContain('"project_meetings_facilitation_object_ck"');
  expect(schema).toContain("jsonb_typeof(${table.facilitation}) = 'object'");
  expect(proposal).toContain("project_meetings_facilitation_object_ck");
  expect(proposal).toContain("jsonb_typeof(facilitation)='object'");
  expect(proposal).toContain("ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS facilitation");
 });
 it("MEN-projects-meetings-27 persists every permitted meeting lifecycle status",()=>{
  for(const status of ["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"]){
   expect(schema).toContain("'"+status+"'");
   expect(proposal).toContain("'"+status+"'");
  }
 });
 it("MEN-projects-meetings-27 keeps scheduled-state invariants across schemas",()=>{
  expect(schema).toContain('"project_meetings_schedule_shape_ck"');
  expect(schema).toContain("${table.scheduledByUserId} is not null");
  expect(schema).toContain("${table.meetingUrl} is not null");
  expect(proposal).toContain("scheduled_by_user_id IS NOT NULL");
  expect(proposal).toContain("meeting_url IS NOT NULL");
 });
 it("MEN-projects-meetings-27 supports bounded notes, status and follow-up with strict parsing",()=>{
  const record={...emptyMentorMeetingFacilitation,
   notes:"Agenda",actionItems:"Send evidence",wentWell:"Clear decisions",improve:"Preparation",
   nextTime:"Discuss blockers",followUpAt:"2099-05-01T10:00:00Z",followUpStatus:"OPEN",
   followUpNotes:"Review in one week"};
  expect(mentorMeetingFacilitationSchema.parse(record)).toEqual(record);
  expect(mentorMeetingFacilitationSchema.safeParse({...record,notes:"x".repeat(4001)}).success).toBe(false);
  expect(mentorMeetingFacilitationSchema.safeParse({...record,unknown:"bad"}).success).toBe(false);
  expect(mentorMeetingFacilitationSchema.safeParse({...record,followUpAt:"not-a-date"}).success).toBe(false);
 });
 it("MEN-projects-meetings-27 supplies a real SQL proposal for orchestrator registration",()=>{
  const journal=read("drizzle/meta/_journal.json");
  expect(journal).toContain('"entries"');
  expect(proposal).toContain("ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_status_ck;");
  expect(proposal).toContain("ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_schedule_shape_ck;");
 });
});
