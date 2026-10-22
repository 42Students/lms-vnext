import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("CI10JOB-lane5 DB10 acceptance DDL replay",()=>{
 it("never attempts duplicate table or index creation over registered migrations",()=>{
  const queue=read("scripts/sql/db10-outbound-queue-staging.sql");
  const global=read("docs/planning/sql/db10-global-email-suppression-candidate.sql");
  for(const src of [queue,global]){
   expect(src).toMatch(/CREATE TABLE IF NOT EXISTS/);
   expect(src).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS/);
  }
  expect(queue).toContain("db10_outbound_email_commitment_ck");
  expect(queue).toContain("db10_outbound_claim_shape_ck");
  expect(global).toContain("db10_global_email_suppressions_hash_ck");
 });
 it("preserves fail-closed cross-tenant preflight and validated composite FK",()=>{
  const scope=read("docs/planning/sql/db10-outbound-scope-fk-staging.sql");
  expect(scope).toContain("DB10 outbound organization/college scope mismatch");
  expect(scope).toContain("CREATE UNIQUE INDEX IF NOT EXISTS colleges_id_organization_uq");
  expect(scope).toContain("NOT EXISTS (");
  expect(scope).toContain("AND contype = 'f' AND convalidated");
  expect(scope).toContain("ON DELETE RESTRICT");
 });
 it("keeps dispatcher functions idempotent and publicly inaccessible",()=>{
  const lease=read("docs/planning/sql/db10-outbound-dispatch-lease-candidate.sql");
  expect(lease.match(/CREATE OR REPLACE FUNCTION db10_/g)?.length).toBe(4);
  expect(lease.match(/REVOKE ALL ON FUNCTION db10_/g)?.length).toBe(4);
 });
});
