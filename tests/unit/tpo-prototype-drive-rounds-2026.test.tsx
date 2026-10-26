import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect} from "vitest";
import {TpoDriveRoundsPrototypeReview} from "@/components/tpo/tpo-drive-rounds-prototype-review";

const rid="11111111-1111-4111-8111-111111111111";
const aid="22222222-2222-4222-8222-222222222222";
const job="33333333-3333-4333-8333-333333333333";
const example=[
 {id:rid,sequence:1,kind:"TEST",name:"Online test",status:"COMPLETED",mode:"ONLINE",
  venue:null,scheduledAt:new Date("2026-10-25T04:00:00Z"),durationMinutes:90,
  participants:[{result:{status:"APPLIED"}}]},
 {id:aid,sequence:2,kind:"INTERVIEW",name:"Technical interview",status:"SCHEDULED",mode:"ONSITE",
  venue:"Room 201",scheduledAt:new Date("2026-10-27T04:30:00Z"),durationMinutes:20,
  participants:[{result:null}]},
];
const slots={
 slots:[{id:"slot-1",startsAt:"2026-10-27T04:30:00Z",
   room:"Room 201",panel:"Panel A",status:"BOOKED",applicationId:"ap-1"}],
 roster:[{applicationId:"ap-1",name:"Verified learner"}],
 reschedules:[{id:"request-1",name:"Verified learner",reason:"Clashes with another appointment"}],
 pendingProposals:2,
};

describe("TPO Drive / Rounds source screenshot",()=>{
 it("shows selected real interview slots, per-panel timetable and pending reschedules",()=>{
  const html=renderToStaticMarkup(createElement(TpoDriveRoundsPrototypeReview,{
   rounds:example,selectedId:aid,jobId:job,slots,now:new Date("2026-10-26T08:00:00Z"),
  }));
  expect(html).toContain("Technical interview");
  expect(html).toContain("Tomorrow");
  expect(html).toContain("1 booked slots");
  expect(html).toContain("1 pending requests");
  expect(html).toContain("2 recruiter slot proposals");
  expect(html).toContain("Asked to move");
  expect(html).toContain("Clashes with another appointment");
  expect(html).toContain("Verified learner");
  expect(html).toContain("Room 201");
  expect(html).toContain("Panel A");
  expect(html).toContain("Booked does not necessarily mean the student confirmed.");
  expect(html).toContain("Change the plan");
  expect(html).not.toContain("58 of 64 confirmed");
  expect(html).not.toContain("2 asked to move · 4 haven");
 });
 it("shows a safe fallback when a pending reschedule has no recorded display name",()=>{
  const html=renderToStaticMarkup(createElement(TpoDriveRoundsPrototypeReview,{
   rounds:example,selectedId:aid,jobId:job,
   slots:{...slots,reschedules:[{id:"request-no-name",name:null,reason:null}]},
   now:new Date("2026-10-26T08:00:00Z"),
  }));
  expect(html).toContain("Candidate name unavailable");
  expect(html).toContain("No reason recorded");
  expect(html).not.toContain(">null<");
 });
 it("does not substitute another round for a stale authorized selection",()=>{
  const html=renderToStaticMarkup(createElement(TpoDriveRoundsPrototypeReview,{
   rounds:example,selectedId:"44444444-4444-4444-8444-444444444444",jobId:job,slots:null,
   now:new Date("2026-10-26T08:00:00Z"),
  }));
  expect(html).toContain("That round is not in this authorized drive.");
  expect(html).toContain("No other round has been substituted.");
  expect(html).not.toContain("booked slots");
 });
 it("never interprets source outages as zero slots or fake confirmation",()=>{
  const html=renderToStaticMarkup(createElement(TpoDriveRoundsPrototypeReview,{
   rounds:example,selectedId:aid,jobId:job,slots:null,
   now:new Date("2026-10-26T08:00:00Z"),
  }));
  expect(html).toContain("Candidate slot details could not be verified");
  expect(html).toContain("no slot confirmations are assumed");
  expect(html).not.toContain("0 booked slots");
  expect(html).not.toContain("student confirmed their slot");
 });
});
