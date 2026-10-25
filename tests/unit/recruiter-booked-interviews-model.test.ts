import {describe,it,expect} from "vitest";
import {projectRecruiterBookedInterviews} from "@/modules/placements/recruiter-booked-interviews-model";
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
