import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const tpo:RequestContext={
 user:{id:"33333333-3333-4333-8333-333333333333",
  identityUid:"officer",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId,organizationId,status:"ACTIVE",roles:["TPO"]},
};
const source=readFileSync("src/modules/placements/tpo-configuration-read-service.ts","utf8");
const readers=[
 {name:"getTpoJobTypes",table:"tpoJobTypes",result:"return {ready,rows:rows.map("},
 {name:"getTpoBlockedDates",table:"tpoBlockedDates",result:"return {ready,rows};"},
 {name:"getTpoPrepReadiness",table:"tpoPrepReadiness",result:"return {ready,config:row?.config??null"},
 {name:"listTpoPrepCourses",table:"courses",result:"return tx.select({id:courses.id"},
] as const;
function body(name:string){
 const start=source.indexOf("export async function "+name+"(");
 const next=source.indexOf("export async function ",start+1);
 expect(start).toBeGreaterThanOrEqual(0);
 return source.slice(start,next<0?source.length:next);
}

describe("TPO-settings-audit-CONFIG-READ-11 tenant settings role-revocation barrier",()=>{
 it("does not authorize disabled, role-revoked, suspended, or wrong-college readers",()=>{
  expect(can(tpo,"placements.manage",{collegeId,organizationId})).toBe(true);
  expect(can({...tpo,user:{...tpo.user,platformStatus:"DISABLED"}},
   "placements.manage",{collegeId,organizationId})).toBe(false);
  expect(can({...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}},
   "placements.manage",{collegeId,organizationId})).toBe(false);
  expect(can({...tpo,membership:{...tpo.membership!,status:"SUSPENDED"}},
   "placements.manage",{collegeId,organizationId})).toBe(false);
  expect(can(tpo,"placements.manage",{collegeId:organizationId,organizationId})).toBe(false);
 });
 it.each(readers)("rechecks persisted active role before private $name data, including unavailable-table results",({name,table,result})=>{
  const fn=body(name);
  const preflight=fn.indexOf("await requireTpoBatchActor(ctx)");
  const availability=fn.indexOf("await placementTableExists(");
  const tx=fn.indexOf("getDb().transaction(async tx=>");
  const active=fn.indexOf('college.status!=="ACTIVE"',tx);
  const persisted=fn.indexOf('assertPersistedPlatformPermission(tx,ctx,"placements.manage"',tx);
  const read=fn.indexOf(name==="listTpoPrepCourses"
   ?"return tx.select({id:courses.id":name==="getTpoJobTypes"
    ?"const rows=ready?await tx.select({":name==="getTpoBlockedDates"
     ?"const rows=ready?await tx.select({":"const [row]=ready?await tx.select({",persisted);
  const output=fn.indexOf(result,persisted);
  expect(preflight).toBeGreaterThan(0);
  if(name!=="listTpoPrepCourses")expect(availability).toBeGreaterThan(preflight);
  expect(tx).toBeGreaterThan(preflight);
  expect(active).toBeGreaterThan(tx);
  expect(fn.slice(tx,persisted)).toContain('.for("share").limit(1)');
  expect(persisted).toBeGreaterThan(active);
  expect(read).toBeGreaterThan(persisted);
  expect(output).toBeGreaterThanOrEqual(read);
  expect(fn.slice(persisted,read)).toContain("collegeId,organizationId:college.organizationId");
  expect(fn.slice(read)).toContain(table);
  expect(fn).not.toContain("await getDb().select({");
 });
 it("keeps prep-course catalog scoped to non-archived same-organization active colleges",()=>{
  const prep=body("listTpoPrepCourses");
  expect(prep).toContain("isNull(departments.archivedAt)");
  expect(prep).toContain("eq(colleges.organizationId,college.organizationId)");
  expect(prep).toContain('eq(colleges.status,"ACTIVE")');
  expect(prep).toContain('eq(courses.status,"ACTIVE")');
  expect(prep).toContain("asc(courses.name)");
 });
});
