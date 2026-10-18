import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {isTpoBuiltinJobType,TPO_BUILTIN_JOB_TYPES} from "@/modules/placements/tpo-builtin-job-types";
import {tpoJobTypeNameSchema} from "@/modules/placements/tpo-configuration-model";

/**
 * Regression for a revoked TPO / College Admin session still being used
 * inside a long-running job-type transaction after preflight authorization.
 * A real two-session PostgreSQL role-revocation race is still required in CI.
 */
const service=readFileSync("src/modules/placements/tpo-job-type-write-service.ts","utf8");
const handlers=[
 "createTpoJobType",
 "setTpoJobTypeActive",
 "renameTpoJobType",
 "setTpoBuiltinJobTypeActive",
 "setTpoJobTypeCountsAsPlaced",
] as const;
function bodyOf(name:(typeof handlers)[number]){
 const start=service.indexOf("export async function "+name+"(");
 const following=handlers.map(item=>service.indexOf("export async function "+item+"("))
  .filter(index=>index>start);
 const end=following.length?Math.min(...following):service.length;
 expect(start).toBeGreaterThanOrEqual(0);
 return service.slice(start,end);
}

describe("TPO-settings-audit-23 transactional job-type settings safety",()=>{
 it.each(handlers)("TPO-settings-audit-23 %s checks the persisted actor after locking the college and before settings reads or writes",(name)=>{
  const source=bodyOf(name);
  const begin=source.indexOf("getDb().transaction(async tx=>");
  const collegeLock=source.indexOf('.for("update").limit(1)');
  const permission=source.indexOf('assertPersistedPlatformPermission(tx,');
  const organization=source.indexOf("organizationId:college.organizationId",permission);
  const subsequent=source.slice(permission);
  expect(begin).toBeGreaterThanOrEqual(0);
  expect(collegeLock).toBeGreaterThan(begin);
  expect(permission).toBeGreaterThan(collegeLock);
  expect(organization).toBeGreaterThan(permission);
  expect(subsequent).toContain('"placements.manage"');
  expect(subsequent).toContain("collegeId");
  expect(permission).toBeLessThan(source.indexOf(".insert(placementTpoJobTypes)")>=0?
   source.indexOf(".insert(placementTpoJobTypes)"):source.length);
  if(name!=="createTpoJobType"){
   expect(permission).toBeLessThan(source.indexOf("TPO_SETTINGS_STALE"));
  }
  const activity=source.indexOf("tx.insert(activityEvents)");
  expect(activity).toBeGreaterThan(permission);
 });
 it("TPO-settings-audit-23 retains five distinct fixed choices and prohibits custom overrides of them",()=>{
  expect(TPO_BUILTIN_JOB_TYPES).toHaveLength(5);
  expect(new Set(TPO_BUILTIN_JOB_TYPES.map(item=>item.label))).toEqual(new Set([
   "Full-time","Internship","Internship + full-time","Contract","Apprenticeship",
  ]));
  expect(isTpoBuiltinJobType(" full-TIME ")).toBe(true);
  expect(isTpoBuiltinJobType("Some custom internship")).toBe(false);
 });
 it("TPO-settings-audit-23 rejects empty or punctuation-only labels but accepts Unicode combining marks",()=>{
  for(const value of ["","--","<>","x".repeat(41),"  "])
   expect(tpoJobTypeNameSchema.safeParse(value).success,value).toBe(false);
  for(const value of ["Full stack","తెలుగు నైపుణ్యాలు","Développeur","Part-time"])
   expect(tpoJobTypeNameSchema.safeParse(value).success,value).toBe(true);
 });
});
