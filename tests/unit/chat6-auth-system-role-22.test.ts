import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {
 assignSystemRole,assignSystemRoleInputSchema,
 type SystemRoleRepository,
} from "@/modules/system-roles/service";
import type {RequestContext} from "@/modules/identity/context";

const targetId="11111111-1111-4111-8111-111111111111";
const actorId="22222222-2222-4222-8222-222222222222";
const context=(admin=true,active=true):RequestContext=>({
 user:{id:actorId,identityUid:"actor",platformStatus:active?"ACTIVE":"DISABLED",
  systemRoles:admin?["SUPER_ADMIN"]:[]},
 membership:null,recruiter:null,adminScope:null,
});
const repo={
 persistBootstrapUser:vi.fn(),loadUser:vi.fn(),assignRole:vi.fn(),
};
const repository=repo as unknown as SystemRoleRepository;
beforeEach(()=>{
 vi.resetAllMocks();
 repo.loadUser.mockResolvedValue({id:targetId,platformStatus:"ACTIVE"});
 repo.assignRole.mockResolvedValue(["SUPER_ADMIN"]);
});
describe("AUTH-system-role-22 persisted role-grant protection",()=>{
 it("rejects forged tenant, unexpected role flags, invalid UUID and unsupported system role",()=>{
  expect(assignSystemRoleInputSchema.safeParse({userId:targetId,role:"SUPER_ADMIN"}).success).toBe(true);
  for(const body of [
   {userId:targetId,role:"SUPER_ADMIN",collegeId:targetId},
   {userId:targetId,role:"ROOT"},
   {userId:"invalid",role:"SUPER_ADMIN"},
   {role:"SUPER_ADMIN"},
   null,
  ])expect(assignSystemRoleInputSchema.safeParse(body).success).toBe(false);
 });
 it("denies learners and disabled platform accounts before revealing target existence",async()=>{
  for(const actor of [context(false),context(true,false)]){
   await expect(assignSystemRole(actor,{userId:targetId,role:"SUPER_ADMIN"},repository)).rejects.toThrow();
  }
  expect(repo.loadUser).not.toHaveBeenCalled();
  expect(repo.assignRole).not.toHaveBeenCalled();
 });
 it("rejects missing or disabled targets without inserting any role",async()=>{
  repo.loadUser.mockResolvedValueOnce(null);
  await expect(assignSystemRole(context(),{userId:targetId,role:"SUPER_ADMIN"},repository))
   .rejects.toMatchObject({code:"USER_NOT_FOUND"});
  repo.loadUser.mockResolvedValueOnce({id:targetId,platformStatus:"DISABLED"});
  await expect(assignSystemRole(context(),{userId:targetId,role:"SUPER_ADMIN"},repository))
   .rejects.toMatchObject({code:"USER_DISABLED"});
  expect(repo.assignRole).not.toHaveBeenCalled();
 });
 it("passes exact authenticated context to the persisted transactional grant writer",async()=>{
  const admin=context();
  await expect(assignSystemRole(admin,{userId:targetId,role:"SUPER_ADMIN"},repository))
   .resolves.toEqual(["SUPER_ADMIN"]);
  expect(repo.assignRole).toHaveBeenCalledWith(targetId,"SUPER_ADMIN",admin);
  expect(repo.assignRole).toHaveBeenCalledOnce();
 });
 it("rechecks persisted actor and active target under locks, inserts idempotently and audits only real grants",()=>{
  const code=readFileSync("src/modules/system-roles/repository.ts","utf8");
  const grant=code.slice(code.indexOf("async assignRole("));
  expect(grant).toContain("return db.transaction(async tx=>");
  expect(grant).toContain('await assertPersistedPlatformPermission(tx,context,"system-role.manage")');
  expect(grant).toContain('.for("share").limit(1)');
  expect(grant).toContain('target.platformStatus!=="ACTIVE"');
  expect(grant).toContain(".onConflictDoNothing()");
  expect(grant).toContain("if(inserted.length)");
  expect(grant).toContain("recordActivityEventInTransaction(tx,context");
  expect(grant).toContain("PLATFORM_SYSTEM_ROLE_ASSIGNED");
  expect(grant).toContain('importance:"CRITICAL"');
  expect(grant.indexOf("assertPersistedPlatformPermission(")).toBeLessThan(grant.indexOf("tx.insert(systemRoles)"));
  expect(grant.indexOf("tx.insert(systemRoles)")).toBeLessThan(grant.indexOf("recordActivityEventInTransaction("));
 });
});
