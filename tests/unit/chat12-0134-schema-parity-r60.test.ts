import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const sql=read("drizzle/0134_lanes_round_2.sql");
const general=read("src/db/schema/placement-general-requests.ts");
const prep=read("src/db/schema/placement-tpo-prep-assignments.ts");
const exports=read("src/db/schema/index.ts");
const effectiveRequestSql=sql.split("create table if not exists placement_learner_general_requests (")[1]?.split(");")[0]??"";

describe("chat-12 migration 0134 effective schema fidelity",()=>{
 it("TPO-requests-verification-01 exports the requests table from the shared Drizzle schema",()=>{
  expect(exports).toContain('export * from "./placement-general-requests"');
  expect(general).toContain('export const placementLearnerGeneralRequests=');
 });
 it("TPO-requests-verification-01 exports the immutable request events table",()=>{
  expect(general).toContain("export const placementLearnerGeneralRequestEvents=");
  expect(general).toContain('pgTable("placement_learner_general_request_events"');
 });
 it("TPO-students-10 exports registered course preparation assignment table",()=>{
  expect(exports).toContain('export * from "./placement-tpo-prep-assignments"');
  expect(prep).toContain("export const placementTpoPrepAssignments=");
 });
 it("TPO-requests-verification-01 keeps varchar(150) target key in the first effective 0134 table",()=>{
  expect(effectiveRequestSql).toContain("target_key varchar(150) not null");
  expect(general).toContain('targetKey:varchar("target_key",{length:150})');
 });
 it("TPO-requests-verification-01 uses five registered kinds and guards the sixth separately",()=>{
  expect(effectiveRequestSql).not.toContain("'OFFER_ACCEPTANCE_DISPUTE'");
  expect(general).toContain("('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')");
  expect(general).not.toContain("'PLACEMENT_AFTER_PLACEMENT','OFFER_ACCEPTANCE_DISPUTE'");
  expect(read("src/modules/placements/tpo-general-request-service.ts")).toContain('await requireRegisteredKind(tx,input.kind)');
 });
 it("TPO-requests-verification-01 retains two-column tenant-bound membership foreign key",()=>{
  expect(effectiveRequestSql).toContain("foreign key(membership_id,college_id)");
  expect(general).toContain("columns:[t.membershipId,t.collegeId]");
 });
 it("TPO-requests-verification-01 retains the status/decision pair invariant",()=>{
  expect(effectiveRequestSql).toContain("constraint placement_general_request_decision_ck");
  expect(general).toContain('check("placement_general_request_decision_ck"');
 });
 it("TPO-requests-verification-01 keeps only one pending request per target and kind",()=>{
  expect(sql).toContain("placement_general_request_one_pending_target_uq");
  expect(general).toContain('uniqueIndex("placement_general_request_one_pending_target_uq")');
  expect(general).toContain(".on(t.membershipId,t.kind,t.targetKey)");
 });
 it("TPO-requests-verification-01 matches event status width and parent index",()=>{
  expect(sql).toContain("prior_status varchar(20),next_status varchar(20) not null");
  expect(general).toContain('nextStatus:varchar("next_status",{length:20})');
  expect(general).toContain('index("placement_general_request_events_parent_idx")');
 });
 it("TPO-students-10 matches non-null due date and dedupes per offering",()=>{
  expect(sql).toContain("due_at timestamptz not null");
  expect(prep).toContain('dueAt:timestamp("due_at",{withTimezone:true}).notNull()');
  expect(prep).toContain('uniqueIndex("tpo_prep_member_offering_uq")');
 });
 it("TPO-students-10 matches creation-to-due integrity and same-college learner FK",()=>{
  expect(prep).toContain('check("tpo_prep_due_after_assigned_ck"');
  expect(prep).toContain("foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]");
  expect(sql).toContain("tpo_prep_member_college_fk");
 });
});
