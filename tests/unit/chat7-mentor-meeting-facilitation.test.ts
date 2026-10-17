import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {mentorMeetingFacilitationSchema,emptyMentorMeetingFacilitation} from "../../src/modules/projects/mentor-meeting-facilitation-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("mentor meeting facilitated notes",()=>{
 it("MEN-projects-meetings-27 persists retrospective notes action items and follow-up",()=>{
  const candidate={...emptyMentorMeetingFacilitation,notes:"Agenda covered",actionItems:"Ship build",
    wentWell:"Good",improve:"More time",nextTime:"Start earlier",
    followUpStatus:"OPEN",followUpAt:"2099-01-01T10:00:00Z",followUpNotes:"Send summary"};
  expect(mentorMeetingFacilitationSchema.safeParse(candidate).success).toBe(true);
  expect(mentorMeetingFacilitationSchema.safeParse({...candidate,notes:"x".repeat(4001)}).success).toBe(false);
  expect(mentorMeetingFacilitationSchema.safeParse({...candidate,followUpStatus:"HIDDEN"}).success).toBe(false);
  const schema=read("src/db/schema/projects.ts");
  const service=read("src/modules/projects/meeting-service.ts");
  const control=read("src/components/projects/project-meeting-controls.tsx");
  expect(schema).toContain('facilitation: jsonb("facilitation")');
  expect(service).toContain("input.facilitation??existing?.facilitation??{}");
  expect(control).toContain("What went well?");
  expect(control).toContain("Follow-up status");
  expect(control).toContain("Action items");
  expect(control).toContain("expectedUpdatedAt:new Date(meeting.updatedAt).toISOString()");
 });
 it("MEN-projects-meetings-27 accepts each legacy follow-up status and retrospective label",()=>{
  for(const status of ["OPEN","IN_PROGRESS","DONE","BLOCKED"]){
    const parsed=mentorMeetingFacilitationSchema.safeParse({
      ...emptyMentorMeetingFacilitation,followUpStatus:status,
    });
    expect(parsed.success).toBe(true);
  }
  const control=read("src/components/projects/project-meeting-controls.tsx");
  for(const label of ["What went well?","What didn't go well?","Actions for next sprint",
    "In progress","Blocked"]){
    expect(control).toContain(label);
  }
  const request=control.split("export function ScheduleProjectMeetingControl")[0];
  expect(request).not.toContain("value={facilitation[field]}");
  expect(control).toContain('meetingType==="RETRO" ||');
  expect(control).toContain('? "Meeting updated."');
 });
});
