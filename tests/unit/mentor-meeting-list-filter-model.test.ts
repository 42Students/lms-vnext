import {describe,expect,it} from "vitest";
import {mentorMeetingListMatch,mentorMeetingMissingNotes,
 mentorMeetingListKinds,mentorMeetingListScopes} from
 "@/modules/projects/mentor-meeting-list-filter-model";
import type {MentorMeetingCalendarItem} from "@/modules/projects/mentor-calendar-view";
const now=new Date("2026-10-24T12:00:00Z");
function record(status:MentorMeetingCalendarItem["status"],
 type:MentorMeetingCalendarItem["meetingType"],time:string,
 extra:Partial<MentorMeetingCalendarItem>={}):MentorMeetingCalendarItem{
 return {id:"one",projectId:"project-1",projectTitle:"Project",
  projectStatus:"ACTIVE",title:"Meeting",status,meetingType:type,
  startsAt:time,endsAt:new Date(Date.parse(time)+3600000).toISOString(),
  timeZone:"Asia/Kolkata",meetingUrl:null,linkedSprintTitle:null,...extra};
}
describe("Mentor meeting calendar ceremony and period quick filters",()=>{
 it("exposes every requested fast type and period",()=>{
  expect(mentorMeetingListKinds.map(item=>item.id))
    .toEqual(["ALL","REVIEW","RETRO","PLANNING","STANDUP","OTHER"]);
  expect(mentorMeetingListScopes.map(item=>item.id))
    .toEqual(["ALL","COMING","ASKED","PAST","NOTES_MISSING"]);
 });
 it("differentiates review, retro and general/imported Other",()=>{
  const review=record("SCHEDULED","REVIEW","2026-10-26T12:00:00Z");
  expect(mentorMeetingListMatch(review,"REVIEW","COMING",now)).toBe(true);
  expect(mentorMeetingListMatch(review,"RETRO","COMING",now)).toBe(false);
  expect(mentorMeetingListMatch(review,"OTHER","COMING",now)).toBe(false);
  expect(mentorMeetingListMatch(
   {...review,meetingType:"GENERAL"},"OTHER","COMING",now)).toBe(true);
 });
 it("keeps overdue learner requests visible as Asked, not Coming",()=>{
  const asked=record("REQUESTED","GENERAL","2026-10-23T09:00:00Z");
  expect(mentorMeetingListMatch(asked,"ALL","ASKED",now)).toBe(true);
  expect(mentorMeetingListMatch(asked,"ALL","COMING",now)).toBe(false);
  expect(mentorMeetingListMatch(asked,"ALL","PAST",now)).toBe(false);
 });
 it("selects only completed meetings with no substantive notes",()=>{
  const done=record("COMPLETED","RETRO","2026-10-22T09:00:00Z");
  expect(mentorMeetingMissingNotes(done)).toBe(true);
  expect(mentorMeetingListMatch(done,"RETRO","NOTES_MISSING",now)).toBe(true);
  expect(mentorMeetingMissingNotes({...done,facilitation:{wentWell:"Demo"}})).toBe(false);
  expect(mentorMeetingMissingNotes({...done,facilitation:{actionItemRows:[{
   text:"Follow up",owner:null,dueAt:null,complete:false,
  }]}})).toBe(false);
  expect(mentorMeetingMissingNotes({...done,outcome:"Reviewed"})).toBe(false);
 });
 it("does not treat cancelled meetings as unfinished notes",()=>{
  const cancelled=record("CANCELLED","GENERAL","2026-10-22T09:00:00Z");
  expect(mentorMeetingListMatch(cancelled,"ALL","PAST",now)).toBe(true);
  expect(mentorMeetingListMatch(cancelled,"ALL","NOTES_MISSING",now)).toBe(false);
 });
});
