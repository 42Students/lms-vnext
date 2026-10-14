import {describe,expect,it} from "vitest";
import {careerCalendarPeriod,careerCalendarEvents,shiftCareerCalendarDay} from "@/modules/placements/learner-career-calendar-model";
const rounds=[
  {applicationId:"a",roundId:"r1",roundName:"Interview",roundKind:"INTERVIEW",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-31T20:00:00Z",exception:null},
  {applicationId:"a",roundId:"r2",roundName:"Assessment",roundKind:"TEST",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-11-18T20:00:00Z",exception:null},
];
describe("30 day career agenda",()=>{
 it("uses an inclusive IST day range and advances by whole 30 day blocks",()=>{
   const events=careerCalendarEvents(rounds);
   const period=careerCalendarPeriod(events,"2026-10-15","agenda");
   expect(period.start).toBe("2026-10-15");
   expect(period.end).toBe("2026-11-13");
   expect(period.events.map(e=>e.roundId)).toEqual(["r1"]);
   expect(shiftCareerCalendarDay("2026-10-15","agenda",1)).toBe("2026-11-14");
   expect(shiftCareerCalendarDay("2026-11-14","agenda",-1)).toBe("2026-10-15");
 });
 it("retains calendar month behavior separately",()=>{
   const period=careerCalendarPeriod(careerCalendarEvents(rounds),"2026-10-15","month");
   expect(period.start).toBe("2026-10-01");
   expect(period.end).toBe("2026-10-31");
   expect(period.events).toHaveLength(0);
 });
});
