import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 actor:vi.fn(),scope:vi.fn(),db:vi.fn(),select:vi.fn(),ready:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.db}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",
 ()=>({requireTpoBatchActor:mocks.actor}));
vi.mock("@/modules/placements/scope",
 ()=>({requirePlacementManageScope:mocks.scope}));
vi.mock("@/modules/placements/staged-tables",
 ()=>({placementTableExists:mocks.ready}));
import {readTpoCompanyTeam,mutateTpoCompanyTeam,TpoCompanyTeamError}
 from "@/modules/placements/tpo-company-team-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const COMPANY="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OWNER="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const context:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:OWNER,collegeId:COLLEGE,organizationId:ORG,
  status:"ACTIVE",roles:["TPO"]},
};
describe("PROJ-BREAK-TPO-07 revoked private company-team actor",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue(COLLEGE);
  mocks.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mocks.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   limit(){return Promise.resolve([]);},
  }));
  mocks.db.mockReturnValue({select:mocks.select});
 });
 it("prevents a stale signed-in TPO from reading archived company messages",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_ROLE_REVOKED"));
  await expect(readTpoCompanyTeam(context,COMPANY))
   .rejects.toThrow("PERSISTED_ROLE_REVOKED");
  expect(mocks.scope).not.toHaveBeenCalled();
  expect(mocks.db).not.toHaveBeenCalled();
  expect(mocks.ready).not.toHaveBeenCalled();
 });
 it("prevents stale TPO from sending before touching the company relationship",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_ROLE_REVOKED"));
  await expect(mutateTpoCompanyTeam(context,COMPANY,{
   action:"SEND",body:"Private handover",
  })).rejects.toThrow("PERSISTED_ROLE_REVOKED");
  expect(mocks.scope).not.toHaveBeenCalled();
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it("returns indistinguishable NOT_FOUND for company not linked to the active college",async()=>{
  await expect(readTpoCompanyTeam(context,COMPANY))
   .rejects.toBeInstanceOf(TpoCompanyTeamError);
  expect(mocks.actor).toHaveBeenCalledWith(context);
  expect(mocks.scope).toHaveBeenCalledWith(context,COLLEGE);
  expect(mocks.ready).not.toHaveBeenCalled();
 });
 it("does not trust learner or disabled actor even before persisted role inspection",async()=>{
  const denied:RequestContext[]=[
   {...context,membership:{...context.membership!,roles:["LEARNER"]}},
   {...context,membership:{...context.membership!,status:"SUSPENDED"}},
   {...context,user:{...context.user,platformStatus:"DISABLED"}},
   {...context,membership:null},
  ];
  for(const actor of denied){
   await expect(readTpoCompanyTeam(actor,COMPANY)).rejects.toBeDefined();
  }
  expect(mocks.db).not.toHaveBeenCalled();
 });
});
