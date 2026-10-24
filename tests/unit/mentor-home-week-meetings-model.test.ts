import {describe,expect,it} from "vitest";
import {selectMentorHomeWeekMeetings} from
  "@/modules/projects/mentor-home-week-meetings-model";

const meeting=(id:string,startsAt:string,status="SCHEDULED",projectStatus="ACTIVE")=>({
  id,startsAt,status,projectStatus,projectId:"p",projectTitle:"Project",
  title:"Review "+id,
});
describe("Mentor portfolio current-week IST meetings",()=>{
  it("shows all coming meetings in the week, not only the next 48 hours",()=>{
    const now=new Date("2026-10-19T06:00:00Z"); // Monday 11:30 IST
    const rows=[
      meeting("thu","2026-10-22T07:00:00Z"),
      meeting("tue","2026-10-20T07:00:00Z"),
      meeting("next","2026-10-26T03:00:00Z"),
      meeting("mon-past","2026-10-19T05:00:00Z"),
      meeting("wed-request","2026-10-21T07:00:00Z","REQUESTED"),
    ];
    expect(selectMentorHomeWeekMeetings(rows,now).map(row=>row.id))
      .toEqual(["tue","wed-request","thu"]);
  });
  it("uses local Monday midnight boundary and excludes archived/cancelled",()=>{
    const now=new Date("2026-10-25T17:59:00Z"); // Sunday 23:29 IST
    const rows=[
      meeting("sun","2026-10-25T18:00:00Z"),
      meeting("next-mon","2026-10-25T18:30:00Z"),
      meeting("archived","2026-10-25T18:01:00Z","SCHEDULED","ARCHIVED"),
      meeting("cancel","2026-10-25T18:02:00Z","CANCELLED"),
    ];
    expect(selectMentorHomeWeekMeetings(rows,now).map(row=>row.id)).toEqual(["sun"]);
  });
  it("handles invalid timestamps, out-of-order meeting records and empty weeks",()=>{
    const now=new Date("2026-10-23T04:00:00Z");
    const rows=[meeting("bad","invalid"),meeting("late","2026-10-24T13:00:00Z"),
      meeting("early","2026-10-23T13:00:00Z")];
    expect(selectMentorHomeWeekMeetings(rows,now).map(row=>row.id))
      .toEqual(["early","late"]);
    expect(selectMentorHomeWeekMeetings([],now)).toEqual([]);
  });
});
