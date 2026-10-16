import {describe,it,expect} from "vitest";
import {evaluateVerificationEvidence,type Receipt} from "@/modules/profile-verification/evidence";
const membership="learner";
const now=new Date("2026-10-16T12:00:00.000Z");
function base(section:"EDUCATION"|"IDENTITY"){
 return {owningMembershipId:membership,section,now,education:[],hasAadhaarNumber:false,hasPanNumber:false,
   receipts:[] as Receipt[]};
}
describe("LEARNER-profile-misc-15 verification missing-items notices",()=>{
 it("identifies exact legacy education requirements without guessing evidence",()=>{
  const missing=evaluateVerificationEvidence(base("EDUCATION")).missing;
  expect(missing).toEqual(["Add 10th education","Add 12th or Diploma education",
    "Add current degree education","Upload a resume"]);
 });
 it("requires Aadhaar or PAN details plus actual usable document",()=>{
  expect(evaluateVerificationEvidence(base("IDENTITY")).missing).toEqual(["Provide Aadhaar or PAN details"]);
  expect(evaluateVerificationEvidence({...base("IDENTITY"),hasPanNumber:true}).missing).toEqual(["Upload verified PAN document"]);
 });
});
