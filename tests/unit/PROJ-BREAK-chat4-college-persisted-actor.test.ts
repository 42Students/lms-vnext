import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const path=(file:string)=>readFileSync(file,"utf8");
const orgA="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";

function actor():RequestContext {
 return {
  user:{id:"actor",identityUid:"test",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"member",collegeId:collegeA,organizationId:orgA,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 };
}
const scope={collegeId:collegeA,organizationId:orgA};

describe("College Admin Projects persisted actor adversarial journeys",()=>{
 it("PROJ-BREAK-COL-ACTOR-01 rejects all revoked, expired, wrong-college and wrong-role snapshots",()=>{
  const c=actor();
  expect(can(c,"projects.manage",scope)).toBe(true);
  expect(can(c,"projects.manage",{collegeId:collegeB,organizationId:orgA})).toBe(false);
  expect(can(c,"projects.manage",{collegeId:collegeA,organizationId:orgB})).toBe(false);
  expect(can({...c,membership:null},"projects.manage",scope)).toBe(false);
  expect(can({...c,membership:{...c.membership!,status:"SUSPENDED"}},"projects.manage",scope)).toBe(false);
  expect(can({...c,membership:{...c.membership!,status:"ENDED"}},"projects.manage",scope)).toBe(false);
  expect(can({...c,membership:{...c.membership!,roles:["FACULTY"]}},"projects.manage",scope)).toBe(false);
  expect(can({...c,user:{...c.user,platformStatus:"DISABLED"}},"projects.manage",scope)).toBe(false);
  const superAdmin={...c,user:{...c.user,systemRoles:["SUPER_ADMIN"] as const}};
  expect(can({...superAdmin,adminScope:{collegeId:collegeB,organizationId:orgB}},"projects.manage",scope)).toBe(false);
  expect(can({...superAdmin,adminScope:{collegeId:collegeA,organizationId:orgB}},"projects.manage",scope)).toBe(false);
  expect(can({...superAdmin,adminScope:{collegeId:collegeA,organizationId:orgA}},"projects.manage",scope)).toBe(true);
 });

 it("PROJ-BREAK-COL-ACTOR-02 locks and rechecks persistent rights before idempotent summary retries",()=>{
  const s=path("src/modules/projects/college-project-summary-service.ts");
  const rowLock=s.indexOf('.for("update").limit(1);');
  const role=s.indexOf('assertPersistedPlatformPermission(tx,context,"projects.manage"');
  const noOp=s.indexOf("if(collegeProjectSummaryMatchesCurrent(row,input))return row;");
  const mutation=s.indexOf("tx.update(projectInstances)");
  const audit=s.indexOf("recordActivityEventInTransaction");
  expect(rowLock).toBeGreaterThan(-1);
  expect(role).toBeGreaterThan(rowLock);
  expect(noOp).toBeGreaterThan(role);
  expect(mutation).toBeGreaterThan(noOp);
  expect(s).toContain("collegeId:scope.collegeId,organizationId:scope.organizationId");
  expect(s.slice(role)).toContain("notifyActiveProjectMembers");
  expect(audit).toBeGreaterThan(-1);
 });

 it("PROJ-BREAK-COL-ACTOR-03 rejects revoked account before even a roster no-op",()=>{
  const s=path("src/modules/projects/college-project-roster-service.ts");
  const rowLock=s.indexOf('.for("update").limit(1);');
  const role=s.indexOf('assertPersistedPlatformPermission(tx,context,"projects.manage"');
  const noOp=s.indexOf('if(toAdd.length===0&&toRemove.length===0)return');
  const update=s.indexOf('tx.update(projectMembers)');
  expect(rowLock).toBeGreaterThan(-1);
  expect(role).toBeGreaterThan(rowLock);
  expect(noOp).toBeGreaterThan(role);
  expect(update).toBeGreaterThan(noOp);
  expect(s).toContain('eq(collegeMemberships.collegeId,scope.collegeId)');
  expect(s).toContain('eq(users.platformStatus,"ACTIVE")');
 });

 it("PROJ-BREAK-COL-ACTOR-04 re-authorizes against persisted roles inside the class-team SERIALIZABLE transaction",()=>{
  const s=path("src/modules/projects/class-team-workspace-service.ts");
  const tx=s.indexOf("db.transaction(async tx =>");
  const lock=s.indexOf('.for("share").limit(1);',tx);
  const role=s.indexOf("const persistedActor = await assertPersistedPlatformPermission(");
  const firstWrite=s.indexOf("tx.insert(lmsGroups)");
  const audit=s.indexOf("recordActivityEventInTransaction(tx,context");
  expect(tx).toBeGreaterThan(-1);
  expect(lock).toBeGreaterThan(tx);
  expect(role).toBeGreaterThan(lock);
  expect(firstWrite).toBeGreaterThan(role);
  expect(audit).toBeGreaterThan(firstWrite);
  expect(s).toContain('isolationLevel:"serializable"');
  expect(s).toContain('createdByType:isSuperAdmin(persistedActor)?"SUPER_ADMIN":"COLLEGE_ADMIN"');
  const route=path("src/app/api/projects/class-team-workspaces/route.ts");
  expect(route.indexOf("isSameOriginRequest(request)")).toBeLessThan(route.indexOf("request.json()"));
  expect(route).toContain("getCurrentRequestContext()");
 });
});
