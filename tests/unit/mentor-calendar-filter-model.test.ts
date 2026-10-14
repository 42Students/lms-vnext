import {describe,expect,it} from "vitest";
import {mentorCalendarFiltersSchema,filterMentorCalendar,mentorCalendarFilterHref}
  from "@/modules/projects/mentor-calendar-filter-model";
import type {MentorMeetingCalendarItem} from "@/modules/projects/mentor-calendar-view";
const item=(id:string,status:MentorMeetingCalendarItem["status"],title:string,
  projectTitle="Project A"):MentorMeetingCalendarItem=>({
    id,projectId:"p",projectTitle,projectStatus:"ACTIVE",title,status,
    startsAt:"2026-10-14T10:00:00.000Z",endsAt:"2026-10-14T11:00:00.000Z",
    timeZone:"Asia/Kolkata",meetingUrl:null,linkedSprintTitle:null,
  });
describe("Mentor global calendar filters",()=>{
  it("combines actual meeting status with literal project and meeting text",()=>{
    const rows=[item("a","REQUESTED","=Weekly Review"),
      item("b","SCHEDULED","Sprint demo"),item("c","REQUESTED","Plan","Another")];
    const query=mentorCalendarFiltersSchema.parse({status:"REQUESTED",search:"Weekly"});
    expect(filterMentorCalendar(rows,query).map(row=>row.id)).toEqual(["a"]);
    expect(mentorCalendarFilterHref(query)).toContain("status=REQUESTED");
    expect(filterMentorCalendar(rows,{...query,search:"another"}).map(row=>row.id))
      .toEqual(["c"]);
  });
  it("rejects untrusted scope and nonregistered status",()=>{
    expect(mentorCalendarFiltersSchema.safeParse({status:"REMOVED"}).success).toBe(false);
    expect(mentorCalendarFiltersSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
    expect(mentorCalendarFiltersSchema.safeParse({search:"x".repeat(101)}).success).toBe(false);
  });
});
