import {describe,expect,it} from "vitest";
import {getTableColumns,getTableName} from "drizzle-orm";
import {readFileSync} from "node:fs";
import {
 placementLearnerGeneralRequests,placementLearnerGeneralRequestEvents,placementTpoPrepAssignments
} from "@/db/schema";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("registered migration 0134 Drizzle schema parity",()=>{
 it("TPO-requests-verification-01 exports general requests with the registered effective target and status widths",()=>{
  const fields=getTableColumns(placementLearnerGeneralRequests);
  expect(getTableName(placementLearnerGeneralRequests)).toBe("placement_learner_general_requests");
  expect(fields.targetKey.getSQLType()).toBe("varchar(150)");
  expect(fields.status.getSQLType()).toBe("varchar(20)");
  expect(fields.membershipId.notNull).toBe(true);
  expect(fields.payload.notNull).toBe(true);
  expect(fields.payload.hasDefault).toBe(false);
  expect(fields.requestedByUserId.notNull).toBe(true);
  const src=read("src/db/schema/placement-general-requests.ts");
  expect(src).toContain('name:"placement_general_request_member_college_fk"');
  expect(src).toContain('placement_general_request_one_pending_target_uq');
  expect(src).toContain('placement_general_request_payload_ck');
  expect(src).toContain('placement_general_request_decision_ck');
 });
 it("TPO-requests-verification-01 exposes the registered immutable request event shape",()=>{
  const fields=getTableColumns(placementLearnerGeneralRequestEvents);
  expect(getTableName(placementLearnerGeneralRequestEvents)).toBe("placement_learner_general_request_events");
  expect(fields.nextStatus.getSQLType()).toBe("varchar(20)");
  expect(fields.priorStatus.getSQLType()).toBe("varchar(20)");
  expect(fields.requestId.notNull).toBe(true);
  expect(read("src/db/schema/placement-general-requests.ts")).toContain("placement_general_request_events_parent_idx");
 });
 it("TPO-students-10 exports the registered prep assignments, including college-scoped membership FK",()=>{
  const fields=getTableColumns(placementTpoPrepAssignments);
  expect(getTableName(placementTpoPrepAssignments)).toBe("placement_tpo_prep_assignments");
  expect(fields.dueAt.notNull).toBe(true);
  expect(fields.offeringId.notNull).toBe(true);
  const src=read("src/db/schema/placement-tpo-prep-assignments.ts");
  expect(src).toContain('name:"tpo_prep_member_college_fk"');
  expect(src).toContain('tpo_prep_member_offering_uq');
  expect(read("src/db/schema/index.ts")).toContain('export * from "./placement-tpo-prep-assignments"');
 });
 it("TPO-requests-verification-01 does not silently treat the second IF NOT EXISTS SQL as effective DDL",()=>{
  const migration=read("drizzle/0134_lanes_round_2.sql");
  const table=migration.indexOf("create table if not exists placement_learner_general_requests");
  const later=migration.indexOf("CREATE TABLE IF NOT EXISTS placement_learner_general_requests");
  expect(table).toBeGreaterThanOrEqual(0);
  expect(later).toBeGreaterThan(table);
  expect(migration.slice(table,later)).toContain("target_key varchar(150)");
  expect(migration.slice(table,later)).not.toContain("OFFER_ACCEPTANCE_DISPUTE");
 });
});
