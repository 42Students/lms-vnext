import {describe,it,expect} from "vitest";
import {projectRecruiterBookedInterviews,groupRecruiterBookedPanels} from "@/modules/placements/recruiter-booked-interviews-model";
const date=(time:string)=>new Date(time);
describe("recruiter confirmed round panel projection",()=>{
 const base={
  slotId:"a",roundId:"round1",name:"Shortlisted Student",
  startsAt:date("2026-10-28T04:30:00Z"),endsAt:date("2026-10-28T04:50:00Z"),
  panel:"Panel A",room:"201",confirmedAt:date("2026-10-27T00:00:00Z"),
  learnerConfirmedAt:date("2026-10-27T01:00:00Z"),
 };
 it("distinguishes TPO and student confirmations, not inferred from booking",()=>{
  expect(projectRecruiterBookedInterviews([base])[0]?.confirmation).toBe("CONFIRMED");
  expect(projectRecruiterBookedInterviews([{...base,learnerConfirmedAt:null}])[0]?.confirmation)
   .toBe("AWAITING_STUDENT");
  expect(projectRecruiterBookedInterviews([{...base,confirmedAt:null}])[0]?.confirmation)
   .toBe("AWAITING_COLLEGE");
 });
 it("rejects corrupt times and sorts deterministically",()=>{
  const earlier={...base,slotId:"earlier",startsAt:date("2026-10-28T03:00:00Z")};
  expect(projectRecruiterBookedInterviews([
    base,{...base,slotId:"invalid",endsAt:base.startsAt},earlier,
  ]).map(row=>row.slotId)).toEqual(["earlier","a"]);
 });
});

describe("Recruiter panel lists group by round, panel and room",()=>{
 const date=(minutes:number)=>new Date(Date.UTC(2026,9,26,4,minutes));
 const item=(slotId:string,roundId:string,panel:string|null,room:string,time:number)=>
  ({slotId,roundId,panel,room,startsAt:date(time)});
 it("keeps separate panel assignments and sorts appointments within them",()=>{
  const groups=groupRecruiterBookedPanels([
   item("b","round1","A","201",20),
   item("c","round1","B","202",10),
   item("a","round1","A","201",0),
  ]);
  expect(groups).toHaveLength(2);
  expect(groups[0]?.panel).toBe("A");
  expect(groups[0]?.appointments.map(row=>row.slotId)).toEqual(["a","b"]);
  expect(groups[1]?.appointments.map(row=>row.slotId)).toEqual(["c"]);
 });
 it("cannot merge appointments belonging to different rounds",()=>{
  expect(groupRecruiterBookedPanels([
   item("a","round1","A","201",0),item("b","round2","A","201",0),
  ])).toHaveLength(2);
 });
});
