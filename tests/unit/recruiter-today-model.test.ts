import {describe,expect,it} from "vitest";
import {buildRecruiterToday,recruiterTodayWeek} from "@/modules/placements/recruiter-today-model";
import type {PlacementCalendarEvent} from "@/modules/placements/placement-calendar-model";
const base = { job:{id:"a",title:"Developer",status:"PUBLISHED",archivedAt:null,
 applicationDeadline:new Date("2026-10-16T10:00:00Z")},collegeId:"college-a"};
const event = {id:"round:1",kind:"ROUND",status:"SCHEDULED",jobId:"a",jobTitle:"Developer",title:"Interview",
 startsAt:new Date("2026-10-15T10:00:00Z")} as PlacementCalendarEvent;
describe("Recruiter Today read projection",()=>{
 it("uses India calendar days, not UTC-day boundaries",()=>{
   expect(recruiterTodayWeek(new Date("2026-10-14T20:00:00Z"))).toEqual({from:"2026-10-15",to:"2026-10-21"});
 });
 it("does not disclose another college or inactive/archived jobs",()=>{
   const now=new Date("2026-10-14T10:00:00Z");
   const result=buildRecruiterToday([base,{...base,collegeId:"college-b",job:{...base.job,id:"foreign"}},
    {...base,job:{...base.job,id:"archived",archivedAt:now}}],[
    event,{...event,id:"foreign",jobId:"foreign"}],"college-a",now);
   expect(result.live).toBe(1);
   expect(result.dueSoon.map(item=>item.job.id)).toEqual(["a"]);
   expect(result.upcomingRounds.map(item=>item.id)).toEqual(["round:1"]);
 });
});
