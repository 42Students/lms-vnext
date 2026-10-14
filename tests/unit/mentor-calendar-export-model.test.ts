import {describe,expect,it} from "vitest";
import {mentorCalendarCsv} from "@/modules/projects/mentor-calendar-export-model";
import type {MentorMeetingCalendarItem} from "@/modules/projects/mentor-calendar-view";
describe("Mentor meetings privacy-safe CSV",()=>{
 it("neutralizes formula cells, uses IST, omits external join links",()=>{
  const row:MentorMeetingCalendarItem={
   id:"meeting",projectId:"project",projectTitle:"=Project",projectStatus:"ACTIVE",
   title:"+Session",status:"REQUESTED",startsAt:"2026-10-14T05:30:00.000Z",
   endsAt:"2026-10-14T06:30:00.000Z",timeZone:"Asia/Kolkata",
   meetingUrl:"https://meet.example.org/secret",linkedSprintTitle:null,
  };
  const csv=mentorCalendarCsv([row],0);
  expect(csv).toContain("'=Project");
  expect(csv).toContain("'+Session");
  expect(csv).toContain("IST");
  expect(csv).not.toContain("https://meet.example.org");
 });
 it("discloses the cap",()=>{
  expect(mentorCalendarCsv([],3)).toContain("3 additional matching meetings");
 });
});
