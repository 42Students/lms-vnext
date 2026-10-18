import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
const m=vi.hoisted(()=>({actor:vi.fn(),writerActor:vi.fn(),scope:vi.fn(),
 db:vi.fn(),select:vi.fn(),insert:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:m.db}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:m.actor,
}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobActor:m.writerActor,
}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:m.scope}));
import {listTpoCompanyPeople,saveTpoCompanyPerson}
 from "@/modules/placements/tpo-company-person-service";
const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ctx:RequestContext={
 user:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",identityUid:"tpo-contact",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",collegeId:COLLEGE,
  organizationId:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",status:"ACTIVE",roles:["TPO"]},
};
const change={action:"CREATE",confirmed:true,name:"Contact",email:"contact@example.org"};
describe("TPO-companies-contact-role-01 persisted authorization and contact IDOR",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  m.actor.mockResolvedValue(COLLEGE);
  m.scope.mockResolvedValue({id:COLLEGE});
 });
 it("refuses revoked TPO before any contact email, company, or CRM lookup",async()=>{
  m.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(listTpoCompanyPeople(ctx,COMPANY)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(saveTpoCompanyPerson(ctx,COMPANY,change)).rejects.toBeInstanceOf(AuthorizationError);
  expect(m.scope).not.toHaveBeenCalled();
  expect(m.db).not.toHaveBeenCalled();
 });
 it("refuses a persisted user who has moved to a different college",async()=>{
  m.actor.mockResolvedValue("ffffffff-ffff-4fff-8fff-ffffffffffff");
  await expect(listTpoCompanyPeople(ctx,COMPANY)).rejects.toBeInstanceOf(AuthorizationError);
  expect(m.scope).not.toHaveBeenCalled();
  expect(m.db).not.toHaveBeenCalled();
 });
 it("holds the current TPO actor in the same transaction as contact creates and events",async()=>{
  const tx={select:m.select,insert:m.insert};
  m.db.mockReturnValue({transaction:(fn:(trx:typeof tx)=>Promise<unknown>)=>fn(tx)});
  m.writerActor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(saveTpoCompanyPerson(ctx,COMPANY,change)).rejects.toBeInstanceOf(AuthorizationError);
  expect(m.writerActor).toHaveBeenCalledWith(tx,ctx);
  expect(m.select).not.toHaveBeenCalled();
  expect(m.insert).not.toHaveBeenCalled();
 });
 it("rejects malformed ID and contact inputs instead of changing a different company",async()=>{
  await expect(saveTpoCompanyPerson(ctx,"../other-college",change)).rejects.toBeDefined();
  await expect(saveTpoCompanyPerson(ctx,COMPANY,{...change,email:"javascript:alert(1)"}))
   .rejects.toBeDefined();
  expect(m.db).not.toHaveBeenCalled();
 });
});
