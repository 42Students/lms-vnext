import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mock=vi.hoisted(()=>({
 db:vi.fn(),scope:vi.fn(),actor:vi.fn(),ready:vi.fn(),persisted:vi.fn(),
 select:vi.fn(),txSelect:vi.fn(),txInsert:vi.fn(),txDelete:vi.fn(),transaction:vi.fn(),
 changed:true, inserts:[] as unknown[], deletes:0,
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
import {mutateTpoCompanyTeam} from "@/modules/placements/tpo-company-team-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const actor:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo-follow",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-companies-05 company team follow / unfollow persisted transitions",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();mock.changed=true;mock.inserts=[];mock.deletes=0;
  mock.actor.mockResolvedValue(COLLEGE);
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mock.persisted.mockResolvedValue(actor);
  mock.ready.mockResolvedValue(true);
  mock.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   limit(){return Promise.resolve([{id:COMPANY,name:"Company",relationshipStatus:"ACTIVE"}]);},
  }));
  mock.txSelect.mockImplementation(()=>({
   from(){return this;},where(){return this;},for(){return this;},
   limit(){return Promise.resolve([{id:"linked-relation"}]);},
  }));
  mock.txInsert.mockImplementation(()=>{
   const ix=mock.txInsert.mock.calls.length;
   return {values(value:unknown){
    mock.inserts.push(value);
    return {onConflictDoNothing(){return this;},
      returning(){return Promise.resolve(mock.changed?[{membershipId:actor.membership!.id}]:[]);}};
   }};
  });
  mock.txDelete.mockImplementation(()=>({
   where(){return this;},
   returning(){return Promise.resolve(mock.changed?[{membershipId:actor.membership!.id}]:[]);},
  }));
  const tx={select:mock.txSelect,insert:mock.txInsert,delete:mock.txDelete};
  mock.transaction.mockImplementation(async(cb:(client:typeof tx)=>Promise<unknown>)=>cb(tx));
  mock.db.mockReturnValue({select:mock.select,transaction:mock.transaction});
 });
 it("a new follow changes exactly one scoped row and records one activity",async()=>{
  const result=await mutateTpoCompanyTeam(actor,COMPANY,{action:"FOLLOW",following:true});
  expect(result).toEqual({changed:true});
  expect(mock.inserts).toHaveLength(2);
  expect(mock.inserts[0]).toMatchObject({collegeId:COLLEGE,companyId:COMPANY,
   membershipId:actor.membership!.id});
  expect(mock.inserts[1]).toMatchObject({module:"PLACEMENTS",
   eventType:"placements.tpo_company_team.follow_changed",
   subjectId:COMPANY,metadata:{following:true}});
  expect(mock.txDelete).not.toHaveBeenCalled();
 });
 it("an already-following retry returns unchanged with zero activity events",async()=>{
  mock.changed=false;
  expect(await mutateTpoCompanyTeam(actor,COMPANY,{action:"FOLLOW",following:true}))
   .toEqual({changed:false});
  expect(mock.inserts).toHaveLength(1);
  expect(mock.txDelete).not.toHaveBeenCalled();
 });
 it("unfollow removes only the active actor and emits one activity when changed",async()=>{
  expect(await mutateTpoCompanyTeam(actor,COMPANY,{action:"FOLLOW",following:false}))
   .toEqual({changed:true});
  expect(mock.txDelete).toHaveBeenCalledTimes(1);
  expect(mock.inserts).toHaveLength(1);
  expect(mock.inserts[0]).toMatchObject({eventType:"placements.tpo_company_team.follow_changed",
   subjectId:COMPANY,metadata:{following:false}});
 });
 it("a repeated unfollow does not double-audit or raise a misleading error",async()=>{
  mock.changed=false;
  expect(await mutateTpoCompanyTeam(actor,COMPANY,{action:"FOLLOW",following:false}))
   .toEqual({changed:false});
  expect(mock.txDelete).toHaveBeenCalledTimes(1);
  expect(mock.inserts).toEqual([]);
 });
});
