import {describe,expect,it} from "vitest";
import {buildHrOfferOverview,hrSelectionReadyApplicationIds,type HrRoundRead}
 from "@/modules/placements/hr-offer-selection-read-model";
const pass=(applicationId:string)=>({applicationId,result:{status:"APPLIED",outcome:"PASS"}});
const fail=(applicationId:string)=>({applicationId,result:{status:"APPLIED",outcome:"FAIL"}});
const round=(participants:HrRoundRead["participants"],kind="TEST",status="COMPLETED"):HrRoundRead=>({
 kind,status,participants,
});
describe("HR-OFFER-DEPTH-60: selection decisions require one unambiguous pass per completed round",()=>{
 it("denies duplicate PASS/PASS for one applicant instead of falsely multiplying selection readiness",()=>{
  expect(hrSelectionReadyApplicationIds([round([pass("a"),pass("a"),pass("b")])])).toEqual(["b"]);
 });
 it("does not let PASS override FAIL, HOLD or unrecorded duplicates in the same round",()=>{
  const candidates=[pass("a"),fail("a"),pass("b"),{
   applicationId:"b",result:{status:"STAGED",outcome:"PASS"}},pass("c")];
  expect(hrSelectionReadyApplicationIds([round(candidates)])).toEqual(["c"]);
 });
 it("retains only applicants with exactly one APPLIED PASS in every evaluative round",()=>{
  const rounds=[round([pass("a"),pass("b")]),round([pass("a"),pass("a"),pass("b")],"INTERVIEW")];
  expect(hrSelectionReadyApplicationIds(rounds)).toEqual(["b"]);
 });
 it("rejects pending stages and TALK-only schedules, preserving original review order",()=>{
  const participants=[pass("b"),pass("a")];
  expect(hrSelectionReadyApplicationIds([round(participants,"TALK")])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([round(participants,"TEST","PENDING")])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([round(participants,"TEST"),
   round(participants,"INTERVIEW")])).toEqual(["b","a"]);
 });
 it("does not publish blank IDs, null outcomes, or a result only staged by a recruiter",()=>{
  const people=[pass(" "),{applicationId:"not-yet",result:null},
   {applicationId:"staged",result:{status:"STAGED",outcome:"PASS"}}];
  expect(hrSelectionReadyApplicationIds([round(people)])).toEqual([]);
 });
 it("offer summary counts persisted offer rows and distinguishes expired awaiting replies",()=>{
  const now=new Date("2099-05-01T00:00:00.000Z");
  const offers=[
   {id:"one",applicationId:"a",status:"ISSUED",expiresAt:now,joiningStatus:null},
   {id:"two",applicationId:"a",status:"ISSUED",expiresAt:new Date(now.getTime()-1),joiningStatus:null},
   {id:"three",applicationId:"b",status:"ACCEPTED",expiresAt:null,joiningStatus:"JOINED"},
   {id:"four",applicationId:"c",status:"WITHDRAWN",expiresAt:null,joiningStatus:"JOINED"},
  ];
  expect(buildHrOfferOverview(offers,now)).toEqual({recorded:4,issued:2,accepted:1,
   declined:0,joined:1,awaitingReply:1,overdue:1});
 });
});
