import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mock=vi.hoisted(()=>({
 db:vi.fn(),scope:vi.fn(),actor:vi.fn(),ready:vi.fn(),persisted:vi.fn(),
 select:vi.fn(),txSelect:vi.fn(),txInsert:vi.fn(),transaction:vi.fn(),
 messageSaved:true,originalBody:"Private handover",insertCount:0,selectCount:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",
 ()=>({requireTpoBatchActor:mock.actor}));
vi.mock("@/modules/permissions/persisted-actor",
 ()=>({assertPersistedPlatformPermission:mock.persisted}));
vi.mock("@/modules/placements/staged-tables",
 ()=>({placementTableExists:mock.ready}));
import {mutateTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const KEY="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const MESSAGE="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const EVENT="ffffffff-ffff-4fff-8fff-ffffffffffff";
const ctx:RequestContext={
 user:{id:"11111111-1111-4111-8111-111111111111",identityUid:"tpo-test",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"22222222-2222-4222-8222-222222222222",collegeId:COLLEGE,
  organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
const send=(body=mock.originalBody)=>({
 action:"SEND" as const,body,idempotencyKey:KEY,
});
describe("TPO-companies-05 private company Team idempotent SEND service",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.messageSaved=true;
  mock.originalBody="Private handover";
  mock.insertCount=0;
  mock.selectCount=0;
  mock.actor.mockResolvedValue(COLLEGE);
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mock.persisted.mockResolvedValue(ctx);
  mock.ready.mockResolvedValue(true);
  mock.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   limit(){return Promise.resolve([{id:COMPANY,name:"Company",relationshipStatus:"ACTIVE"}]);},
  }));
  mock.txSelect.mockImplementation(()=>{
   const number=++mock.selectCount;
   const value=number===1?[{id:"relationship"}]:
     number===2?[{id:MESSAGE,body:mock.originalBody,decision:false,assignee:null,dueAt:null}]:[];
   return {
    from(){return this;},where(){return this;},for(){return this;},
    limit(){return Promise.resolve(value);},
    then(resolve:(value:unknown)=>unknown){return Promise.resolve([]).then(resolve);},
   };
  });
  mock.txInsert.mockImplementation(()=>{
   const number=++mock.insertCount;
   const result=number===1?(mock.messageSaved?[{id:MESSAGE}]:[]):[{id:EVENT}];
   return {
    values(){return this;},onConflictDoNothing(){return this;},
    returning(){return Promise.resolve(result);},
   };
  });
  const tx={select:mock.txSelect,insert:mock.txInsert};
  mock.transaction.mockImplementation(async(cb:(client:typeof tx)=>Promise<unknown>)=>cb(tx));
  mock.db.mockReturnValue({select:mock.select,transaction:mock.transaction});
 });
 it("persists message once with a single audit entry and does not email guessed @names",async()=>{
  const result=await mutateTpoCompanyTeam(ctx,COMPANY,send("Private handover @random"));
  expect(result).toEqual({changed:true,id:MESSAGE});
  expect(mock.persisted).toHaveBeenCalledWith(expect.anything(),ctx,"placements.manage",{
   collegeId:COLLEGE,organizationId:ORG,
  });
  expect(mock.txInsert).toHaveBeenCalledTimes(2);
  expect(mock.txSelect).toHaveBeenCalledTimes(2); // locked relation + followers
 });
 it("replay of the same key and payload is a read-only no-op, not a second notification",async()=>{
  mock.messageSaved=false;
  const result=await mutateTpoCompanyTeam(ctx,COMPANY,send());
  expect(result).toEqual({changed:false,id:MESSAGE});
  expect(mock.txInsert).toHaveBeenCalledTimes(1);
  expect(mock.txSelect).toHaveBeenCalledTimes(2); // relation + original key
 });
 it("same-key different payload is a conflict, not a silent overwrite or second audit",async()=>{
  mock.messageSaved=false;
  await expect(mutateTpoCompanyTeam(ctx,COMPANY,send("Tampered update")))
   .rejects.toBeInstanceOf(TpoCompanyTeamError);
  expect(mock.txInsert).toHaveBeenCalledTimes(1);
 });
 it("request trying to self-assign private Team work is rejected before any write",async()=>{
  await expect(mutateTpoCompanyTeam(ctx,COMPANY,{
   action:"SEND",body:"Assign",assigneeId:ctx.membership!.id,
   dueAt:"2099-01-01T17:00:00+05:30",
  })).rejects.toBeInstanceOf(TpoCompanyTeamError);
  expect(mock.txInsert).not.toHaveBeenCalled();
 });
});
