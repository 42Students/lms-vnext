import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getTpoMyNotifications} from "@/modules/placements/tpo-my-notifications-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));

const college="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const ctx:RequestContext={
 user:{id:"tpo-u",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:college,organizationId:org,status:"ACTIVE",roles:["TPO"]},
};
const now=new Date("2026-10-18T00:00:00Z");
function dbMock(){
 const countWhere=vi.fn(async()=>[{total:2,unread:1}]);
 const filteredWhere=vi.fn(async()=>[{total:1}]);
 const offset=vi.fn(async()=>[{
  id:"notice-1",module:"PLACEMENTS",importance:"NORMAL",
  createdAt:now,readAt:null,
 }]);
 const select=vi.fn()
  .mockImplementationOnce(()=>({from:()=>({innerJoin:()=>({where:countWhere})})}))
  .mockImplementationOnce(()=>({from:()=>({innerJoin:()=>({where:filteredWhere})})}))
  .mockImplementationOnce(()=>({from:()=>({innerJoin:()=>({
   where:()=>({orderBy:()=>({limit:()=>({offset})})}),
  })})}));
 const tx={select:vi.fn()};
 const db={select,transaction:vi.fn(async(cb:(x:typeof tx)=>Promise<unknown>)=>cb(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {db,tx,countWhere,filteredWhere,offset};
}
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(requirePlacementManageScope).mockResolvedValue({
  id:college,organizationId:org,
 } as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(placementTableExists).mockResolvedValue(false);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(ctx);
});
describe("chat-16 own-college TPO inbox count and presentation privacy",()=>{
 it("TPO-notification-inbox-16 denies disabled users, learner roles and missing TPO membership",async()=>{
  const invalid:RequestContext[]=[
   {...ctx,membership:null},
   {...ctx,membership:{...ctx.membership!,roles:["LEARNER"]}},
   {...ctx,user:{...ctx.user,platformStatus:"DISABLED"}},
  ];
  for(const actor of invalid){
   await expect(getTpoMyNotifications(actor,{})).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("TPO-notification-inbox-17 rejects unapproved filters or unbounded page values before querying",async()=>{
  for(const filter of [{view:"OTHER"},{page:"0"},{page:"1e6"},{pageSize:101},{collegeId:college}]){
   await expect(getTpoMyNotifications(ctx,filter)).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("TPO-notification-inbox-18 returns fixed labels and counts without rendering database-supplied notification body",async()=>{
  const f=dbMock();
  const result=await getTpoMyNotifications(ctx,{view:"UNREAD",page:1,pageSize:25});
  expect(result).toMatchObject({
   collegeId:college,summary:{total:2,unread:1,read:1},
   matchedTotal:1,totalPages:1,
   items:[{id:"notice-1",subject:"Placement update",status:"UNREAD"}],
   preferences:{source:"UNAVAILABLE",values:null},
  });
  expect(JSON.stringify(result)).not.toContain("subjectLabel");
  expect(JSON.stringify(result)).not.toContain("actionHref");
  expect(f.offset).toHaveBeenCalledWith(0);
 });
 it("TPO-notification-inbox-19 denies stale actor after retrieval if persisted TPO membership was revoked",async()=>{
  dbMock();
  vi.mocked(assertPersistedPlatformPermission).mockResolvedValue({
   ...ctx,membership:{...ctx.membership!,roles:["LEARNER"]},
  });
  await expect(getTpoMyNotifications(ctx,{})).rejects.toThrow();
  expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
   expect.anything(),ctx,"placements.manage",{collegeId:college,organizationId:org},
  );
 });
});