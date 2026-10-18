import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const source=()=>readFileSync("src/modules/colleges/admin-session-service.ts","utf8");
const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";
const orgA="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const root:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId:collegeA,organizationId:orgA},
};

describe("Super Admin tenant sessions adversarial management",()=>{
 it("SA-colleges-sessions-RETRY-01 a zero-revocation retry never appends a duplicate security audit",()=>{
  const s=source();
  const start=s.indexOf("export async function revokeCollegeAdminSessions(");
  const tx=s.indexOf("getDb().transaction(async tx=>",start);
  const persisted=s.indexOf('assertPersistedPlatformPermission(tx,ctx,"college.manage"',tx);
  const update=s.indexOf("UPDATE identity_device_sessions",persisted);
  const noOp=s.indexOf("if(rows.rows.length===0)return {revoked:0};",update);
  const audit=s.indexOf("recordActivityEventInTransaction(tx,ctx",update);
  expect(tx).toBeGreaterThan(start);
  expect(persisted).toBeGreaterThan(tx);
  expect(update).toBeGreaterThan(persisted);
  expect(noOp).toBeGreaterThan(update);
  expect(audit).toBeGreaterThan(noOp);
  expect(s).toContain("AND revoked_at IS NULL");
  expect(s).toContain("AND expires_at>now() RETURNING id");
 });

 it("SA-colleges-sessions-SCOPE-01 only an authorized Super Admin in the selected tenant can revoke admins",()=>{
  expect(can(root,"college.manage",{collegeId:collegeA,organizationId:orgA})).toBe(true);
  expect(can(root,"college.manage",{collegeId:collegeB,organizationId:orgA})).toBe(false);
  expect(can(root,"college.manage",{collegeId:collegeA,organizationId:orgB})).toBe(false);
  expect(can({...root,user:{...root.user,platformStatus:"DISABLED"}},
   "college.manage",{collegeId:collegeA,organizationId:orgA})).toBe(false);
  const s=source();
  expect(s).toContain("getSuperAdminTenantLifecycleDetail(ctx,collegeId)");
  expect(s).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(s).toContain("eq(collegeMemberships.userId,userId)");
  expect(s).toContain('inArray(membershipRoles.role,["COLLEGE_ADMIN","TPO"])');
  expect(s).toContain('if(!isSuperAdmin(ctx))throw new AuthorizationError("college.manage")');
 });

 it("SA-colleges-sessions-READ-01 all sensitive session/target/history readers check the persisted platform role",()=>{
  const s=source();
  const actions=[
   "listCollegeAdminSessionTargets","listCollegeAdminSessions","listCollegeAdminHistory",
  ];
  for(const [index,name] of actions.entries()){
   const start=s.indexOf("export async function "+name+"(");
   const next=s.indexOf("export async function ",start+20);
   const body=s.slice(start,next>=0?next:undefined);
   expect(start).toBeGreaterThan(-1);
   expect(body).toContain("getDb().transaction(async tx=>");
   expect(body).toContain('assertPersistedPlatformPermission(tx,ctx,"college.manage"');
   const auth=body.indexOf("assertPersistedPlatformPermission");
   const table=body.includes("tx.execute")?body.indexOf("tx.execute"):body.indexOf("tx.select");
   expect(table).toBeGreaterThan(auth);
   expect(body).toContain("collegeId");
  }
 });

 it("SA-colleges-sessions-PRIVACY-01 history only includes target membership/user actions of its college",()=>{
  const s=source();
  const begin=s.indexOf("export async function listCollegeAdminHistory(");
  const body=s.slice(begin);
  expect(body).toContain("authorizedTarget(ctx,collegeId,userId)");
  expect(body).toContain("eq(activityEvents.collegeId,target.college.id)");
  expect(body).toContain('inArray(activityEvents.module,["IDENTITY","PLATFORM"])');
  expect(body).toContain("eq(activityEvents.subjectId,target.userId)");
  expect(body).toContain("eq(activityEvents.subjectId,target.membershipId)");
  expect(body).toContain(".limit(101).offset((page-1)*100)");
 });
});
