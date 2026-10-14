import {describe,expect,it} from "vitest";
import {careerCalendarEvents} from "@/modules/placements/learner-career-calendar-model";
import {learnerMobileCareerAgenda} from "@/modules/placements/learner-mobile-career-agenda-model";
describe("mobile career calendar groups from IST persisted event instants",()=>{
  it("groups crossing midnight and retains earliest-before-latest ordering",()=>{
    const app="81818181-8181-4818-8818-818181818181";
    const a="82828282-8282-4828-8828-828282828282";
    const b="83838383-8383-4838-8838-838383838383";
    const data=careerCalendarEvents([
      {applicationId:app,roundId:a,roundKind:"TEST",roundName:"Late",roleTitle:"Engineer",
        companyName:"Alpha",scheduledAt:"2026-10-16T18:29:00Z",exception:null},
      {applicationId:app,roundId:b,roundKind:"INTERVIEW",roundName:"Next day",
        roleTitle:"Engineer",companyName:"Beta",scheduledAt:"2026-10-16T18:31:00Z",exception:null},
    ]);
    const groups=learnerMobileCareerAgenda(data);
    expect(groups.map(group=>group.dayKey)).toEqual(["2026-10-16","2026-10-17"]);
    expect(groups.map(group=>group.events[0]?.roundId)).toEqual([a,b]);
    expect(data).toHaveLength(2);
  });
  it("keeps a legitimate empty period genuinely empty",()=>{
    expect(learnerMobileCareerAgenda([])).toEqual([]);
  });
});
