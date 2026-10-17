import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {getTableColumns,getTableName} from "drizzle-orm";
import {placementLearnerGeneralRequests,placementLearnerGeneralRequestEvents,placementTpoPrepAssignments} from "@/db/schema";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("0134 conflict-aware schema",()=>{
 it("TPO-requests-verification-01 uses the first effective request table widths and defaults",()=>{
  const t=getTableColumns(placementLearnerGeneralRequests);
  expect(getTableName(placementLearnerGeneralRequests)).toBe("placement_learner_general_requests");
  expect(t.targetKey.getSQLType()).toBe("varchar(150)");
  expect(t.status.getSQLType()).toBe("varchar(20)");
  expect(t.payload.hasDefault).toBe(false);
  expect(t.version.hasDefault).toBe(true);
 });
 it("TPO-requests-verification-01 preserves tenant composite FK, strict JSON and decision consistency",()=>{
  const s=src("src/db/schema/placement-general-requests.ts");
  for(const name of ["placement_general_request_member_college_fk","placement_general_request_payload_ck",
   "placement_general_request_decision_ck","placement_general_request_one_pending_target_uq"])
    expect(s).toContain(name);
 });
 it("TPO-requests-verification-01 retains 0134 event widths and immutable parent link",()=>{
  const t=getTableColumns(placementLearnerGeneralRequestEvents);
  expect(t.priorStatus.getSQLType()).toBe("varchar(20)");
  expect(t.nextStatus.getSQLType()).toBe("varchar(20)");
  expect(t.requestId.notNull).toBe(true);
 });
 it("TPO-students-10 includes required due_at and composite member scope for 0134 prep",()=>{
  expect(getTableColumns(placementTpoPrepAssignments).dueAt.notNull).toBe(true);
  const s=src("src/db/schema/placement-tpo-prep-assignments.ts");
  for(const name of ["tpo_prep_member_college_fk","tpo_prep_member_offering_uq","tpo_prep_due_after_assigned_ck"])expect(s).toContain(name);
 });
 it("TPO-requests-verification-01 permits the sixth kind only after its check constraint is registered",()=>{
  const service=src("src/modules/placements/tpo-general-request-service.ts");
  expect(service).toContain('kind!=="OFFER_ACCEPTANCE_DISPUTE"');
  expect(service).toContain("pg_get_constraintdef(oid)");
  expect(service).toContain("await requireRegisteredKind(tx,input.kind)");
  expect(service).toContain('throw new TpoGeneralRequestError("UNAVAILABLE")');
  expect(src("docs/proposed-migrations/chat-12-0134-general-requests-correction.sql")).not.toContain("ALTER COLUMN target_key TYPE text");
 });
});
