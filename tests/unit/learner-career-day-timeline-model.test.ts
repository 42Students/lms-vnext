import {describe,expect,it} from "vitest";
import {careerCalendarEvents} from "@/modules/placements/learner-career-calendar-model";
import {learnerCareerDayTimeline} from "@/modules/placements/learner-career-day-timeline-model";
describe("career calendar exact day timeline",()=>{
 it("does not mix UTC and IST calendar days and sorts without mutation",()=>{
   const events=careerCalendarEvents([
     {applicationId:"a",roundId:"late",roundName:"Late",roundKind:"INTERVIEW",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-17T13:00:00Z",exception:null},
     {applicationId:"a",roundId:"early",roundName:"Early",roundKind:"TEST",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-16T19:30:00Z",exception:null},
   ]);
   const selected=learnerCareerDayTimeline([...events].reverse(),"2026-10-17");
   expect(selected.events.map(x=>x.roundId)).toEqual(["early","late"]);
   expect(selected.first?.roundId).toBe("early");
   expect(learnerCareerDayTimeline(events,"2026-10-16").events).toEqual([]);
 });
});
