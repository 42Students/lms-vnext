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
    expect(mentorCalendarFiltersSchema.safeParse({type:"SECRET"}).success).toBe(false);
    expect(mentorCalendarFiltersSchema.safeParse({projectState:"DELETED"}).success).toBe(false);
    const archived={...rows[0]!,projectStatus:"ARCHIVED"};
    expect(filterMentorCalendar([rows[0]!,archived],
      {...query,status:"ALL",search:"",projectState:"ARCHIVED"}).length).toBe(1);
    expect(mentorCalendarFilterHref({...query,projectState:"ARCHIVED"}))
      .toContain("projectState=ARCHIVED");
    const types=[{...rows[0]!,meetingType:"GENERAL" as const},
      {...rows[1]!,meetingType:"REVIEW" as const}];
    expect(filterMentorCalendar(types,{...query,status:"ALL",search:"",type:"REVIEW"})
      .map(row=>row.id)).toEqual(["b"]);
    expect(mentorCalendarFilterHref({...query,type:"REVIEW"})).toContain("type=REVIEW");
    expect(filterMentorCalendar(rows,{...query,search:"another"}).map(row=>row.id))
      .toEqual(["c"]);
  });
  it("uses IST calendar days without dropping a past REQUESTED item from ALL",()=>{
    const instant=new Date("2026-10-14T20:00:00Z");
    const rows=[item("a","REQUESTED","Past"),{
      ...item("b","SCHEDULED","Today"),startsAt:"2026-10-14T19:00:00Z",
    },{...item("c","SCHEDULED","Tomorrow"),startsAt:"2026-10-15T19:00:00Z"}];
    const all=mentorCalendarFiltersSchema.parse({});
    expect(filterMentorCalendar(rows,all,instant)).toHaveLength(3);
    expect(filterMentorCalendar(rows,{...all,period:"TODAY"},instant)
      .map(row=>row.id)).toEqual(["b"]);
    expect(filterMentorCalendar(rows,{...all,period:"NEXT_7_DAYS"},instant)
      .map(row=>row.id)).toEqual(["b","c"]);
    expect(mentorCalendarFilterHref({...all,period:"TODAY"})).toContain("period=TODAY");
  });
  it("shows completed meetings lacking both recorded outcome and structured notes",()=>{
    const completed=item("missing","COMPLETED","Review");
    const withOutcome={...item("outcome","COMPLETED","Review"),outcome:"Decisions recorded"};
    const withReflection={...item("retro","COMPLETED","Retro"),
      facilitation:{wentWell:"Shared results"}};
    const awaiting=item("requested","REQUESTED","Request");
    const query=mentorCalendarFiltersSchema.parse({attention:"NOTES_MISSING"});
    expect(filterMentorCalendar([
      completed,withOutcome,withReflection,awaiting,
    ],query).map(row=>row.id)).toEqual(["missing"]);
    expect(mentorCalendarFilterHref(query)).toContain("attention=NOTES_MISSING");
  });
  it("rejects untrusted scope and nonregistered status",()=>{
    expect(mentorCalendarFiltersSchema.safeParse({period:"NEVER"}).success).toBe(false);
    expect(mentorCalendarFiltersSchema.safeParse({status:"REMOVED"}).success).toBe(false);
    expect(mentorCalendarFiltersSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
    expect(mentorCalendarFiltersSchema.safeParse({search:"x".repeat(101)}).success).toBe(false);
  });
});
