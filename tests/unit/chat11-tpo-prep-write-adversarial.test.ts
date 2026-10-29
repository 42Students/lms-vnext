import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoPrepReadinessSaveSchema,tpoPrepReadinessSamePolicy}
 from "@/modules/placements/tpo-prep-readiness-save-model";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const saved={courseIds:[a,b],minimumCompleted:1};
const version="2026-10-18T11:30:00.000+05:30";

describe("TPO-settings-audit-PREP-CAS-01 safe course setup writes",()=>{
 it("accepts a bounded unique course set and rejects duplicates, invalid IDs, impossible thresholds and injected keys",()=>{
  expect(tpoPrepReadinessSaveSchema.safeParse({...saved,expectedVersion:version}).success).toBe(true);
  for(const bad of [
   {courseIds:[a,a]}, {courseIds:[a,"other-college"]},
   {courseIds:[a],minimumCompleted:2}, {minimumCompleted:-1},
   {minimumCompleted:1.2}, {expectedVersion:"yesterday"},
   {collegeId:a},{userId:a},{unexpected:"another-college"},
   {courseIds:Array.from({length:41},()=>a)},
  ]){
   expect(tpoPrepReadinessSaveSchema.safeParse({...saved,expectedVersion:version,...bad}).success,
    JSON.stringify(bad)).toBe(false);
  }
  expect(tpoPrepReadinessSaveSchema.safeParse({courseIds:[],minimumCompleted:0,expectedVersion:"none"}).success).toBe(true);
 });
 it("accepts only an identical applied policy as an idempotent retry",()=>{
  expect(tpoPrepReadinessSamePolicy(saved,saved)).toBe(true);
  expect(tpoPrepReadinessSamePolicy({...saved,legacySetting:"kept"},saved)).toBe(true);
  for(const bad of [
   null,[],{}, {courseIds:[b,a],minimumCompleted:1},
   {courseIds:[a],minimumCompleted:1},
   {courseIds:[a,b],minimumCompleted:2},
   {courseIds:[a,5],minimumCompleted:1},
   {courseIds:[a,b],minimumCompleted:"1"},
  ])expect(tpoPrepReadinessSamePolicy(bad,saved),JSON.stringify(bad)).toBe(false);
 });
 it("locks a persisted college and actor before no-op, stale version, eligibility, write and audit",()=>{
  const source=readFileSync("src/modules/placements/tpo-prep-readiness-write-service.ts","utf8");
  const lock=source.indexOf('.for("update")');
  const persisted=source.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  const noOp=source.indexOf("tpoPrepReadinessSamePolicy(current.config,input)");
  const stale=source.indexOf('new PrepReadinessError("PREP_STALE")');
  const eligibility=source.indexOf('eq(courses.status,"ACTIVE")');
  const write=source.indexOf(".onConflictDoUpdate");
  const audit=source.indexOf("await tx.insert(activityEvents)");
  expect(lock).toBeGreaterThan(-1);
  expect(persisted).toBeGreaterThan(lock);
  expect(noOp).toBeGreaterThan(persisted);
  expect(stale).toBeGreaterThan(noOp);
  expect(eligibility).toBeGreaterThan(stale);
  expect(write).toBeGreaterThan(eligibility);
  expect(audit).toBeGreaterThan(write);
  expect(source).toContain('eq(colleges.organizationId,college.organizationId)');
  expect(source).toContain('eq(colleges.status,"ACTIVE")');
  expect(source).toContain('eq(courses.enabled,true)');
  expect(source).toContain('isNull(courses.deletedAt)');
  expect(source).toContain('tx.insert(placementTpoPrepCourses)');
  expect(source).toContain('new Set(available.map(row=>row.id)).size!==input.courseIds.length');
  expect(source).toContain("return {changed:false,updatedAt:current.updatedAt.toISOString()}");
  expect(source).toContain("return {changed:true,updatedAt:saved.updatedAt.toISOString()}");
  expect(source).toContain("greatest(clock_timestamp(),date_trunc('milliseconds'");
 });
});
