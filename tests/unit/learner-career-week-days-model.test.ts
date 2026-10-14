import {describe,expect,it} from "vitest";
import {learnerCareerWeekDays} from "@/modules/placements/learner-career-week-days-model";
import {careerCalendarEvents} from "@/modules/placements/learner-career-calendar-model";
describe("seven day mobile career week",()=>{
  it("shows empty dates without implying missing source events",()=>{
    const events=careerCalendarEvents([{applicationId:"a",roundId:"r",roundName:"Round",roundKind:"INTERVIEW",companyName:"A",roleTitle:"Dev",scheduledAt:"2026-10-16T20:00:00Z",exception:null}]);
    const days=learnerCareerWeekDays("2026-10-12",events);
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({dayKey:"2026-10-12",events:[]});
    expect(days[5].events[0].roundId).toBe("r");
    expect(learnerCareerWeekDays("2026-10-12",[]).every(x=>x.events.length===0)).toBe(true);
  });
});
