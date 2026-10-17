import {describe,it,expect} from "vitest";
import {toTpoBlockedCalendarEvents} from "../../src/modules/placements/tpo-blocked-calendar-model";
import {groupPlacementCalendarEvents,summarizePlacementCalendar} from "../../src/modules/placements/placement-calendar-model";

describe("College-blocked calendar dates",()=>{
 it("TPO-calendar-reports-01 projects only the selected inclusive date window as IST all-day blocked events",()=>{
  const rows=[{day:"2099-03-09",reason:"Mock exam"},{day:"2099-03-10",reason:null},{day:"2099-03-12",reason:"Finals"}];
  const result=toTpoBlockedCalendarEvents(rows,"2099-03-10","2099-03-11");
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({id:"blocked:2099-03-10",kind:"BLOCKED",title:"Blocked",status:"BLOCKED",companyId:null});
  expect(result[0]?.startsAt.toISOString()).toBe("2099-03-09T18:30:00.000Z");
  expect(groupPlacementCalendarEvents(result)[0]?.day).toBe("2099-03-10");
 });
 it("TPO-calendar-reports-01 blocked dates do not inflate recruiter round or follow-up counts",()=>{
  const result=toTpoBlockedCalendarEvents([{day:"2099-10-15",reason:"Exam"}],"2099-10-15","2099-10-15");
  expect(summarizePlacementCalendar(result,new Date("2099-10-01T00:00:00Z"))).toMatchObject({
   total:1,rounds:0,deadlines:0,followups:0,next:null,
  });
 });
});
