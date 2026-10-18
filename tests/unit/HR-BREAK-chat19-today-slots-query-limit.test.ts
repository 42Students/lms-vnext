import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterTodayRoundsNeedingSlots} from "@/modules/placements/hr-today-open-slots-model";

describe("HR-BREAK-TODAY-SLOTS-12: authorized interview queue cannot hide unslotted rounds",()=>{
 const rounds=Array.from({length:110},(_,i)=>({id:"round-"+i,name:"Interview "+i}));
 it("filters 100 covered earlier rounds and still sees ten actionable later rounds",()=>{
  const existing=rounds.slice(0,100).map((round,i)=>({
   roundId:round.id,status:i%2===0?"BOOKED":"OFFERED",
  }));
  const actions=recruiterTodayRoundsNeedingSlots(rounds,existing);
  expect(actions.map(row=>row.id)).toEqual(
   rounds.slice(100,108).map(row=>row.id),
  );
  expect(actions.every(row=>row.needsOffer===false)).toBe(true);
  expect(rounds).toHaveLength(110);
 });
 it("distinguishes a prepared proposal from an offered/accepted/active booking",()=>{
  const rows=[
   {id:"cancelled"},
   {id:"proposed"},
   {id:"offered"},
   {id:"booked"},
   {id:"new"},
  ];
  const states=[
   {roundId:"cancelled",status:"CANCELLED"},
   {roundId:"proposed",status:"PROPOSED"},
   {roundId:"offered",status:"OFFERED"},
   {roundId:"booked",status:"BOOKED"},
  ];
  expect(recruiterTodayRoundsNeedingSlots(rows,states)).toEqual([
   {...rows[0],needsOffer:false},
   {...rows[1],needsOffer:true},
   {...rows[4],needsOffer:false},
  ]);
  expect(rows).toHaveLength(5);
 });
 it("rechecks covered state on the second read, preventing stale actionable offers in a race",()=>{
  const nowOffered=[{roundId:"round-101",status:"OFFERED"}];
  const fetched=[{id:"round-101"},{id:"round-102"}];
  expect(recruiterTodayRoundsNeedingSlots(fetched,nowOffered)).toEqual([
   {id:"round-102",needsOffer:false},
  ]);
 });
 it("returns no actions without a matching job or rounds, and keeps foreign slot IDs irrelevant",()=>{
  expect(recruiterTodayRoundsNeedingSlots([],[{roundId:"foreign",status:"BOOKED"}]))
   .toEqual([]);
  expect(recruiterTodayRoundsNeedingSlots([{id:"mine"}],[
   {roundId:"foreign",status:"OFFERED"},
  ])).toEqual([{id:"mine",needsOffer:false}]);
 });
 it("the SQL query anti-joins booked/offered slots BEFORE the limit, with college + authorized jobs",()=>{
  const source=readFileSync("src/modules/placements/hr-today-open-slots-service.ts","utf8");
  const anti=source.indexOf("notExists(");
  const limit=source.indexOf(".limit(100)");
  expect(anti).toBeGreaterThan(0);
  expect(limit).toBeGreaterThan(anti);
  expect(source).toContain("inArray(placementJobRounds.jobId,ids)");
  expect(source).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(source).toContain("eq(hrInterviewSlots.collegeId,collegeId)");
  expect(source).toContain('eq(hrInterviewSlots.status,"OFFERED")');
  expect(source).toContain('eq(hrInterviewSlots.status,"BOOKED")');
  expect(source).toContain("recruiterTodayRoundsNeedingSlots(rounds,covered)");
  expect(source).not.toContain("rounds.filter(round=>!offered.has(round.id)).slice(0,8)");
 });
});
