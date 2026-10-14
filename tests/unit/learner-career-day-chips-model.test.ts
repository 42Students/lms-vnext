import {describe,expect,it} from "vitest";
import {learnerCareerDayChips} from "@/modules/placements/learner-career-day-chips-model";
import type {CareerCalendarEvent} from "@/modules/placements/learner-career-calendar-model";
const make=(key:string,minutes:number):CareerCalendarEvent=>({
  key,applicationId:"own",roundId:key,title:"Round "+key,companyName:"Employer",
  roleTitle:"Engineer",kind:"INTERVIEW",start:new Date(Date.UTC(2026,9,17,12,minutes)),
  dayKey:"2026-10-17",rescheduled:false,
});
describe("career grid chips",()=>{
  it("sorts events, caps labels and never mutates source",()=>{
    const rows=[make("third",30),make("first",0),make("second",15)];
    const result=learnerCareerDayChips(rows);
    expect(result.visible.map(x=>x.key)).toEqual(["first","second"]);
    expect(result.hidden).toBe(1);
    expect(rows[0].key).toBe("third");
  });
  it("returns honest empty state",()=>{
    expect(learnerCareerDayChips([])).toEqual({visible:[],hidden:0});
  });
});
