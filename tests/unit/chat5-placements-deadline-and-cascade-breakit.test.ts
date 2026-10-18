import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {evaluateTpoDriveDeadline,tpoDriveDeadlineSchema} from "@/modules/placements/tpo-drive-deadline-model";
import {assertUndoablePlacementCascadeSnapshot} from "@/modules/placements/placement-cascade-undo-policy";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const old="2099-11-01T12:00:00.000Z";
const later="2099-11-02T12:00:00.000Z";
const now="2099-10-18T12:00:00.000Z";
const id="11111111-1111-4111-8111-111111111111";
const payload={confirmed:true,expectedUpdatedAt:now,newDeadlineIso:later,reason:"Company confirmed revised closing date"};
describe("PLACEMENTS-DEADLINE-SM-01 drive deadline state and optimistic update",()=>{
 it("blocks deadline editing outside active published drives and rejects every non-forward instant",()=>{
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",old,later,now)).toBe("ALLOW");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",null,later,now)).toBe("ALLOW");
  for(const status of ["DRAFT","CLOSED","CANCELLED"]){
   expect(evaluateTpoDriveDeadline(status,"ACTIVE",old,later,now)).toBe("READ_ONLY");
  }
  expect(evaluateTpoDriveDeadline("PUBLISHED","ENDED",old,later,now)).toBe("READ_ONLY");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",old,old,now)).toBe("NOT_LATER");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",old,now,now)).toBe("IN_PAST");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",old,"bad",now)).toBe("INVALID_DATE");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE","bad",later,now)).toBe("INVALID_DATE");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",old,later,"bad")).toBe("INVALID_DATE");
 });
 it("rejects bad timestamps, short reasons, unconfirmed writes and forged college ID",()=>{
  expect(tpoDriveDeadlineSchema.safeParse(payload).success).toBe(true);
  for(const input of [
   {...payload,confirmed:false},
   {...payload,newDeadlineIso:"2026-10-18"},
   {...payload,expectedUpdatedAt:"2099-13-99T00:00:00+05:30"},
   {...payload,reason:"short"},
   {...payload,collegeId:id},
  ])expect(tpoDriveDeadlineSchema.safeParse(input).success).toBe(false);
 });
 it("uses scoped row lock, exact CAS and transactional audit on every update",()=>{
  const code=source("src/modules/placements/tpo-drive-deadline-service.ts");
  expect(code).toContain("requireTpoJobCollege(context)");
  expect(code).toContain("requireTpoJobActor(tx,context)");
  expect(code).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(code).toContain('.for("update")');
  expect(code).toContain("job.updatedAt.toISOString()!==input.expectedUpdatedAt");
  expect(code).toContain("PLACEMENT_JOB_STALE");
  expect(code).toContain("PLACEMENTS_TPO_DRIVE_DEADLINE_EXTENDED");
  expect(code).toContain("auditTpoJobChange(tx,context");
  expect(code).toContain("date_trunc('milliseconds'");
 });
});
describe("PLACEMENTS-CASCADE-BREAK-01 atomic reversal preflight",()=>{
 const snap={acceptedStatus:"ACCEPTED",acceptedHistoryReason:"cascade:"+id,cascadeId:id,
  joiningStatus:"PENDING",joiningHasHistory:false,siblingOfferStatuses:["DECLINED"],
  siblingApplicationStatuses:["WITHDRAWN"]};
 it("refuses to undo a joined/changed cascade, mismatched ID or overwritten sibling",()=>{
  expect(()=>assertUndoablePlacementCascadeSnapshot(snap)).not.toThrow();
  for(const override of [{acceptedStatus:"DECLINED"},{acceptedHistoryReason:"cascade:"+id+"-other"},
   {cascadeId:"22222222-2222-4222-8222-222222222222"},
   {joiningStatus:"JOINED"},{joiningHasHistory:true},
   {siblingOfferStatuses:["ISSUED"]},{siblingApplicationStatuses:["SUBMITTED"]}]){
   expect(()=>assertUndoablePlacementCascadeSnapshot({...snap,...override})).toThrow();
  }
 });
 it("requires a college-scoped offer, serializes on learner membership and compares the final persisted cascade history",()=>{
  const service=source("src/modules/placements/offer-cascade-undo-service.ts");
  expect(service).toContain("requirePlacementManageScope(context, owner.collegeId)");
  expect(service).toContain("membership.collegeId !== owner.collegeId");
  expect(service).toContain('.for("update")');
  expect(service).toContain("assertUndoablePlacementCascadeSnapshot");
  expect(service).toContain("cascade-undo:");
  expect(service).toContain("alreadyUndone: true");
  expect(service).toContain("PLACEMENT_OFFER_INVALID_TRANSITION");
  expect(service).toContain("placementOfferStatusHistory");
  expect(service).toContain("placementApplicationStatusHistory");
 });
});
