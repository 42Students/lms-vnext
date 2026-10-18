import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {can,AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const organizationId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const admin:RequestContext={
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"root",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId,collegeId},
};
const organization=readFileSync("src/modules/organizations/service.ts","utf8");
const college=readFileSync("src/modules/colleges/service.ts","utf8");
const fn=(source:string,name:string)=>{
 const index=source.indexOf("export async function "+name+"(");
 const end=source.indexOf("export async function ",index+1);
 expect(index).toBeGreaterThan(-1);
 return source.slice(index,end<0?source.length:end);
};
describe("SA-tenants-modules-LIFECYCLE-11 cross-tenant and concurrent lifecycle guards",()=>{
 it("denies scoped Super Admin on another organization, disabled account and role removal",()=>{
  expect(can(admin,"college.manage",{organizationId,collegeId})).toBe(true);
  expect(can(admin,"college.manage",{organizationId:collegeId,collegeId})).toBe(false);
  expect(can(admin,"organization.manage",{organizationId:collegeId,collegeId})).toBe(false);
  const disabled:RequestContext={...admin,user:{...admin.user,platformStatus:"DISABLED"}};
  const revoked:RequestContext={...admin,user:{...admin.user,systemRoles:[]}};
  expect(()=>requirePermission(disabled,"organization.manage",{organizationId,collegeId}))
   .toThrow(AuthorizationError);
  expect(()=>requirePermission(revoked,"college.manage",{organizationId,collegeId}))
   .toThrow(AuthorizationError);
 });
 it("serializes archived-parent change with active-child existence before activity",()=>{
  const source=fn(organization,"archiveOrganization");
  const tx=source.indexOf("return db.transaction(async tx=>");
  const role=source.indexOf('assertPersistedPlatformPermission(tx,context,"organization.manage"',tx);
  const parentLock=source.indexOf('.for("update").limit(1)',role);
  const childCheck=source.indexOf("const [activeCollege] = await tx.select(",parentLock);
  const update=source.indexOf("tx.update(organizations)",childCheck);
  const event=source.indexOf("recordActivityEventInTransaction(tx,context",update);
  expect(tx).toBeGreaterThan(0);
  expect(role).toBeGreaterThan(tx);
  expect(parentLock).toBeGreaterThan(role);
  expect(childCheck).toBeGreaterThan(parentLock);
  expect(update).toBeGreaterThan(childCheck);
  expect(event).toBeGreaterThan(update);
  expect(source).not.toContain("const [activeCollege] = await db.select(");
 });
 it("locks active organization and current admin before inserting a new college",()=>{
  const source=fn(college,"createCollege");
  const tx=source.indexOf("return await db.transaction(async tx=>");
  const role=source.indexOf('assertPersistedPlatformPermission(tx,context,"college.manage"',tx);
  const active=source.indexOf('eq(organizations.status,"ACTIVE")',role);
  const lock=source.indexOf('.for("share").limit(1)',active);
  const insert=source.indexOf("tx.insert(colleges)",lock);
  expect(tx).toBeGreaterThan(0);
  expect(role).toBeGreaterThan(tx);
  expect(active).toBeGreaterThan(role);
  expect(lock).toBeGreaterThan(active);
  expect(insert).toBeGreaterThan(lock);
 });
 it.each([
  ["createOrganization","organization.manage"],
  ["renameOrganization","organization.manage"],
  ["restoreOrganization","organization.manage"],
 ])("persisted actor is checked before %s writes", (name,permission)=>{
  const source=fn(organization,name);
  const transaction=source.indexOf("transaction(async tx=>");
  const role=source.indexOf('assertPersistedPlatformPermission(tx,context,"'+permission+'"',transaction);
  const write=source.indexOf("tx.insert(organizations)",role)>=0?
   source.indexOf("tx.insert(organizations)",role):source.indexOf("tx.update(organizations)",role);
  expect(transaction).toBeGreaterThan(-1);
  expect(role).toBeGreaterThan(transaction);
  expect(write).toBeGreaterThan(role);
 });
 it("requires a selected college's real parent when listing archived organizations",()=>{
  const source=fn(organization,"listArchivedOrganizations");
  const selected=source.indexOf("if(selectedCollegeId){");
  const parent=source.indexOf("eq(colleges.id,selectedCollegeId)",selected);
  const role=source.indexOf('assertPersistedPlatformPermission(tx,context,"organization.manage"',parent);
  const filtered=source.indexOf("organizationId?eq(organizations.id,organizationId):undefined",role);
  expect(selected).toBeGreaterThan(0);
  expect(parent).toBeGreaterThan(selected);
  expect(role).toBeGreaterThan(parent);
  expect(filtered).toBeGreaterThan(role);
 });
 it("guards every organization directory branch inside one persisted role transaction",()=>{
  const source=fn(organization,"listOrganizations");
  const transaction=source.indexOf("getDb().transaction(async tx=>");
  const role=source.indexOf('assertPersistedPlatformPermission(tx,context,"organization.read"',transaction);
  const root=source.indexOf("if(isSuperAdmin(context))",role);
  const collegeScope=source.indexOf("if(selected?.collegeId){",root);
  const result=source.indexOf("return tx.select(",collegeScope);
  expect(transaction).toBeGreaterThan(-1);
  expect(role).toBeGreaterThan(transaction);
  expect(root).toBeGreaterThan(role);
  expect(collegeScope).toBeGreaterThan(root);
  expect(result).toBeGreaterThan(collegeScope);
  expect(source).not.toContain("return db.select(");
 });
});
