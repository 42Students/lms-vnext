import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoGeneralRequestInputSchema} from "@/modules/placements/tpo-general-request-model";
const src=readFileSync(new URL("../../src/modules/placements/tpo-general-request-service.ts",import.meta.url),"utf8");
const APP="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ROUND="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("TPO-requests-verification-01 absence dispute state and effect isolation",()=>{
 it("rejects forged application/round identities and recognizes a real independently scoped reason",()=>{
  expect(tpoGeneralRequestInputSchema.safeParse({
   kind:"ABSENCE_DISPUTE",applicationId:APP,roundId:ROUND,
   reason:"My attendance was recorded incorrectly",proofUrl:"https://example.edu/proof",
  }).success).toBe(true);
  expect(tpoGeneralRequestInputSchema.safeParse({
   kind:"ABSENCE_DISPUTE",applicationId:"foreign",roundId:ROUND,reason:"Please review",
  }).success).toBe(false);
 });
 it("requires the attendance, owning membership, matched round/job and college to exist at decision time",()=>{
  const start=src.indexOf('if(row.kind==="ABSENCE_DISPUTE")');
  const end=src.indexOf('return {effect:"ABSENCE_CORRECTED"',start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const effect=src.slice(start,end);
  expect(effect).toContain("eq(placementApplications.membershipId,row.membershipId)");
  expect(effect).toContain("eq(placementJobRounds.jobId,placementApplications.jobId)");
  expect(effect).toContain("eq(placementJobs.collegeId,row.collegeId)");
  expect(effect).toContain('.for("update",{of:placementRoundAttendance})');
  expect(effect).toContain('record.status!=="ABSENT"');
  expect(effect).toContain('eq(placementRoundAttendance.status,"ABSENT")');
 });
 it("records an immutable correction event and a real attendance change in the decision transaction",()=>{
  const start=src.indexOf('if(row.kind==="ABSENCE_DISPUTE")');
  const end=src.indexOf('return {effect:"ABSENCE_CORRECTED"',start);
  const effect=src.slice(start,end);
  const write=effect.indexOf('tx.update(placementRoundAttendance).set(');
  const audit=effect.indexOf("await tx.insert(activityEvents).values(");
  expect(write).toBeGreaterThan(0);
  expect(audit).toBeGreaterThan(write);
  expect(effect).toContain('status:"PRESENT"');
  expect(effect).toContain('previousStatus:"ABSENT"');
  expect(effect).toContain('eventType:"PLACEMENTS_ATTENDANCE_DISPUTE_CORRECTED"');
  expect(effect).toContain("requestId:row.id");
  expect(src).toContain('const effect=decision.action==="APPROVE"?await approveEffect(tx,ctx,row):null');
  expect(src).toContain('throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED")');
 });
});
