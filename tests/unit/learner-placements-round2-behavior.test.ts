import {describe,it,expect} from "vitest";
import {learnerDrivePayFacts} from "@/modules/placements/learner-drive-pay-model";
import {learnerRoundIsDayOnly,partitionLearnerPlacementSchedule,learnerRoundLastActiveInstant} from "@/modules/placements/learner-placement-schedule-model";
import {readLearnerApplicationUrl,updateLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
describe("Learner placements model outcomes",()=>{
 it("LEARNER-placements-R06 returns only persisted package breakdown amounts",()=>{
  const facts=learnerDrivePayFacts({minimumAnnualCtcInr:900000,maximumAnnualCtcInr:1100000,
   fixedLpa:"6.50",variableLpa:"2.50",joiningBonusLpa:null,stipendPerMonthInr:20000});
  expect(facts.ctc).toContain("₹9 LPA");
  expect(facts.fixed).toBe("₹6.5 LPA");
  expect(facts.variable).toBe("₹2.5 LPA");
  expect(facts.joiningBonus).toBe("Not disclosed");
  expect(facts.stipend).toBe("₹20,000 / month");
 });
 it("LEARNER-placements-R07 recognizes midnight IST as day only",()=>{
  const dayOnly=new Date("2099-01-01T18:30:00Z");
  expect(learnerRoundIsDayOnly(dayOnly)).toBe(true);
  expect(learnerRoundIsDayOnly(new Date("2099-01-01T07:30:00Z"))).toBe(false);
  expect(learnerRoundLastActiveInstant(dayOnly,120)-dayOnly.getTime()).toBe(86400000);
 });
 it("LEARNER-placements-R07 keeps running rounds upcoming until duration ends",()=>{
  const start=new Date("2099-01-01T07:30:00Z");
  const rows=[{applicationId:"a",roundId:"r",roundName:"Interview",companyName:"Acme",
    roleTitle:"Intern",scheduledAt:start,exception:null,durationMinutes:120}];
  expect(partitionLearnerPlacementSchedule(rows,new Date("2099-01-01T08:00:00Z")).ahead).toHaveLength(1);
  expect(partitionLearnerPlacementSchedule(rows,new Date("2099-01-01T09:31:00Z")).past).toHaveLength(1);
 });
 it("LEARNER-placements-32 defaults to In progress while explicit All is retained",()=>{
  expect(readLearnerApplicationUrl("").view).toBe("progress");
  const query=updateLearnerApplicationUrl("",{view:"all"});
  expect(readLearnerApplicationUrl(query).view).toBe("all");
 });
});