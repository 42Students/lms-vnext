import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {legacyLearnerRequestChoices,TPO_GENERAL_REQUEST_APPROVABLE_KINDS,tpoGeneralRequestCanApprove}
 from "@/modules/placements/tpo-general-request-model";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("TPO general request decision capability parity",()=>{
 it("keeps all seven legacy request choices mapped to specialized or general workflows",()=>{
  expect(legacyLearnerRequestChoices.map(row=>row.legacyKind)).toEqual([
   "WITHDRAWAL","OFFER_EXTENSION","REGISTRATION_CHANGE","ABSENCE_DISPUTE",
   "CORRECTION","EXTERNAL_OFFER","PAP",
  ]);
 });
 it("makes absence disputes approvable, while preserving fail-closed unsupported kinds",()=>{
  expect(TPO_GENERAL_REQUEST_APPROVABLE_KINDS).toEqual([
   "OFF_CAMPUS_OFFER","REGISTRATION_CHANGE","ABSENCE_DISPUTE",
  ]);
  for(const kind of TPO_GENERAL_REQUEST_APPROVABLE_KINDS)
   expect(tpoGeneralRequestCanApprove(kind)).toBe(true);
  for(const kind of ["CORRECTION_WITH_PROOF","PLACEMENT_AFTER_PLACEMENT",
   "OFFER_ACCEPTANCE_DISPUTE","NOT_A_REQUEST",""])
   expect(tpoGeneralRequestCanApprove(kind)).toBe(false);
 });
 it("uses the shared approval policy in the TPO review dialog",()=>{
  const panel=source("src/components/placements/tpo-general-requests-panel.tsx");
  expect(panel).toContain("const approveSupported=tpoGeneralRequestCanApprove;");
  expect(panel).toContain('approveSupported(selection?.kind??"")');
  expect(panel).toContain('action==="APPROVE"&&!approveSupported(selection?.kind??"")');
  expect(panel).toContain('No placement record will be silently changed.');
 });
 it("requires the absence correction to remain a scoped transactional attendance effect",()=>{
  const service=source("src/modules/placements/tpo-general-request-service.ts");
  const start=service.indexOf('if(row.kind==="ABSENCE_DISPUTE")',service.indexOf("async function approveEffect"));
  const end=service.indexOf('return {effect:"ABSENCE_CORRECTED"',start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const block=service.slice(start,end);
  expect(block).toContain('eq(placementApplications.membershipId,row.membershipId)');
  expect(block).toContain('eq(placementJobs.collegeId,row.collegeId)');
  expect(block).toContain('record.status!=="ABSENT"');
  expect(block).toContain('status:"PRESENT"');
  expect(block).toContain('eventType:"PLACEMENTS_ATTENDANCE_DISPUTE_CORRECTED"');
  expect(service).toContain('throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED")');
 });
});
