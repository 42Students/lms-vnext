import {describe,expect,it} from "vitest";
import {planVerificationSubmission,VerificationStateError} from "@/modules/profile-verification/domain";
const membership="11111111-1111-4111-8111-111111111111";
describe("own verification submission contract",()=>{
 const original={learnerMembershipId:membership,section:"EDUCATION" as const,existing:null,expectedVersion:0,
  snapshot:{education:[]},documentsReady:true,
  actor:{kind:"LEARNER" as const,userId:membership,displayName:null},now:new Date("2026-10-15T12:00:00Z")};
 it("starts waiting from server-held evidence only when valid",()=>{
  expect(planVerificationSubmission(original).record.status).toBe("SUBMITTED");
 });
 it("denies absent private evidence and non-learner actors",()=>{
  expect(()=>planVerificationSubmission({...original,documentsReady:false})).toThrow(VerificationStateError);
  expect(()=>planVerificationSubmission({...original,actor:{kind:"TPO",userId:membership,displayName:null}})).toThrow("NOT_ALLOWED");
 });
});
