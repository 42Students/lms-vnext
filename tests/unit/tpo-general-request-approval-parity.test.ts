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
   "OFFER_ACCEPTANCE_DISPUTE",
  ]);
  for(const kind of TPO_GENERAL_REQUEST_APPROVABLE_KINDS)
   expect(tpoGeneralRequestCanApprove(kind)).toBe(true);
  for(const kind of ["CORRECTION_WITH_PROOF","PLACEMENT_AFTER_PLACEMENT",
   "NOT_A_REQUEST",""])
   expect(tpoGeneralRequestCanApprove(kind)).toBe(false);
 });
 it("uses the shared approval policy in the TPO review dialog",()=>{
  const panel=source("src/components/placements/tpo-general-requests-panel.tsx");
  expect(panel).toContain("const approveSupported=tpoGeneralRequestCanApprove;");
  expect(panel).toContain('approveSupported(selection?.kind??"")');
  expect(panel).toContain('action==="APPROVE"&&!approveSupported(selection?.kind??"")');
  expect(panel).toContain('No placement record will be silently changed.');
 });
 it("reverses only a timely, scoped, still-provisional external acceptance",()=>{
  const src=source("src/modules/placements/tpo-general-request-service.ts");
  const start=src.indexOf('if(row.kind==="OFFER_ACCEPTANCE_DISPUTE")',
   src.indexOf("async function approveEffect"));
  const end=src.indexOf('return {effect:"EXTERNAL_ACCEPTANCE_REVERSED"',start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const block=src.slice(start,end);
  for(const required of [
   "eq(collegeMemberships.id,row.membershipId)",
   "eq(collegeMemberships.collegeId,row.collegeId)",
   "eq(placementApplications.membershipId,row.membershipId)",
   "eq(placementJobs.collegeId,row.collegeId)",
   'offer.acceptanceChannel!=="EXTERNAL_IMPORT"',
   "offer.cascadeId!==null",
   "row.requestedAt.getTime()>offer.acceptedDisputableUntil.getTime()",
   'joining.status!=="PENDING"',
   '.for("update",{of:placementOffers})',
   'status:"ISSUED",acceptanceChannel:null,acceptedDisputableUntil:null',
   'respondedByUserId:null,respondedAt:null',
   "expiresAt,rowVersion:offer.rowVersion+1",
   'eq(placementOffers.rowVersion,offer.rowVersion)',
   'fromStatus:"ACCEPTED",toStatus:"ISSUED"',
  ])expect(block,required).toContain(required);
  expect(src).toContain("const effect=decision.action===\"APPROVE\"?await approveEffect(tx,ctx,row):null");
  expect(src).toContain('throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED")');
 });
 it("requires an individually reviewed acceptance dispute, never bulk approval",()=>{
  const bulk=source("src/modules/placements/tpo-general-request-bulk-model.ts");
  expect(bulk).toContain('if(row.kind==="OFFER_ACCEPTANCE_DISPUTE")');
  expect(bulk).toContain("Review each external-acceptance dispute individually.");
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
