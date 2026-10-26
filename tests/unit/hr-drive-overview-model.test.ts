import {describe,expect,it} from "vitest";
import {buildHrDriveOverview} from "@/modules/placements/hr-drive-overview-model";
const base={job:{status:"PUBLISHED",applicationDeadline:new Date("2026-10-17T10:00:00Z")},
 applicants:{all:10,shortlisted:8,withdrawn:2},offers:[{status:"ISSUED"},{status:"ACCEPTED"},{status:"DECLINED"}],
 rounds:[{kind:"TALK",status:"COMPLETED"},{kind:"INTERVIEW",status:"COMPLETED"},{kind:"TEST",status:"SCHEDULED"}]};
describe("HR Drive Overview persisted count summary",()=>{
 it("counts only evaluative completed rounds and separates accepted offers",()=>{
  expect(buildHrDriveOverview(base,new Date("2026-10-14T10:00:00Z"))).toEqual({
   shared:10,active:8,withdrawn:2,issuedOffers:1,acceptedOffers:1,totalRounds:2,
   completedRounds:1,deadlineState:"DUE_SOON",readOnly:false,closed:false});
 });
 it("treats closed drives and expired deadlines honestly",()=>{
  const r=buildHrDriveOverview({...base,job:{...base.job,status:"CLOSED"}},new Date("2026-10-18T10:00:00Z"));
  expect(r.readOnly).toBe(true);
  expect(r.closed).toBe(true);
  expect(r.deadlineState).toBe("PASSED");
 });
});
