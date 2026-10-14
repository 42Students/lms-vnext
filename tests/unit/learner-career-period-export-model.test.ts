import {describe,expect,it} from "vitest";
import {careerCalendarEvents} from "@/modules/placements/learner-career-calendar-model";
import {learnerCareerSelectedPeriodIcal} from "@/modules/placements/learner-career-period-export-model";
describe("career period .ics selection",()=>{
 it("respects IST date, includes exact UTC schedule, excludes adjacent month",()=>{
   const events=careerCalendarEvents([
    {applicationId:"a",roundId:"oct",roundName:"October interview",roundKind:"INTERVIEW",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-16T20:00:00Z",exception:null},
    {applicationId:"a",roundId:"nov",roundName:"November round",roundKind:"INTERVIEW",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-31T20:00:00Z",exception:null},
   ]);
   const out=learnerCareerSelectedPeriodIcal(events,"2026-10-17","month",new Date("2026-10-15T00:00:00Z"));
   expect(out.count).toBe(1);
   expect(out.ical).toContain("DTSTART:20261016T200000Z");
   expect(out.ical).not.toContain("November round");
   expect(learnerCareerSelectedPeriodIcal(events,"2026-10-16","day",new Date()).count).toBe(0);
 });
});
