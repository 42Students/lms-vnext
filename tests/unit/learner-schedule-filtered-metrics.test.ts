import {describe,expect,it} from "vitest";
import {filterScheduleEvents,upcomingScheduleEvents} from "@/components/academics/learner-schedule-model";
import {eventsForLearnerIstScheduleDay,learnerIstScheduleToday} from "@/modules/academics/learner-ist-schedule-model";

describe("learner class schedule selected-course metrics",()=>{
  it("does not count events belonging to a deselected course in Today and Next",()=>{
    const now=new Date("2026-10-15T04:00:00.000Z");
    const events=[
      {id:"a",deliveryId:"course-a",startsAt:"2026-10-15T05:00:00.000Z",endsAt:"2026-10-15T06:00:00.000Z"},
      {id:"b",deliveryId:"course-b",startsAt:"2026-10-15T07:00:00.000Z",endsAt:"2026-10-15T08:00:00.000Z"},
      {id:"section",deliveryId:null,startsAt:"2026-10-15T09:00:00.000Z",endsAt:"2026-10-15T10:00:00.000Z"},
    ];
    const visible=filterScheduleEvents(events,["course-b"]);
    expect(visible.map(e=>e.id)).toEqual(["b","section"]);
    expect(eventsForLearnerIstScheduleDay(visible,learnerIstScheduleToday(now)).map(e=>e.id))
      .toEqual(["b","section"]);
    expect(upcomingScheduleEvents(visible,now,3).map(e=>e.id)).toEqual(["b","section"]);
  });
  it("retains genuine section-wide events when all courses are deselected",()=>{
    const rows=[
      {deliveryId:"one",startsAt:"2026-10-15T06:00:00Z",endsAt:"2026-10-15T07:00:00Z"},
      {deliveryId:null,startsAt:"2026-10-15T06:00:00Z",endsAt:"2026-10-15T07:00:00Z"},
    ];
    expect(filterScheduleEvents(rows,[])).toEqual([rows[1]]);
  });
});
