import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {saveMyTpoNotificationPreferences}
 from "@/modules/placements/tpo-my-notification-preferences-write";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));
const college="11111111-1111-4111-8111-111111111111";
const organization="22222222-2222-4222-8222-222222222222";
const user="33333333-3333-4333-8333-333333333333";
const tpo:RequestContext={
 user:{id:user,identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:college,organizationId:organization,
  status:"ACTIVE",roles:["TPO"]},
};
const input={morningDigest:true,recruiterMessages:true,requests:true,
 resultsReady:true,followUps:true,expectedVersion:null as string|null};
function mockDb(current:Record<string,unknown>|null){
 const collegeLimit=vi.fn(async()=>[{id:college}]);
 const prefLimit=vi.fn(async()=>current?[current]:[]);
 const select=vi.fn()
  .mockImplementationOnce(()=>({from:()=>({where:()=>({for:()=>({limit:collegeLimit})})})}))
  .mockImplementationOnce(()=>({from:()=>({where:()=>({limit:prefLimit})})}));
 const auditValues=vi.fn(async(_input:unknown)=>undefined);
 const prefValues=vi.fn((_input:unknown)=>({
  onConflictDoUpdate:()=>({returning:async()=>[{updatedAt:new Date("2026-10-18T12:00:00Z")}]}),
 }));
 const insert=vi.fn().mockImplementationOnce(()=>({values:prefValues}))
  .mockImplementationOnce(()=>({values:auditValues}));
 const tx={select,insert};
 const db={transaction:vi.fn(async(cb:(x:typeof tx)=>Promise<unknown>)=>cb(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {tx,db,collegeLimit,prefLimit,prefValues,auditValues};
}
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(placementTableExists).mockResolvedValue(true);
 vi.mocked(requirePlacementManageScope).mockResolvedValue({
  id:college,organizationId:organization,
 } as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(tpo);
});

describe("chat-16 TPO personal notification preferences live mutation authorization",()=>{
 it("TPO-notifications-preferences-16 denies foreign fields, wrong role and disabled actor before DB",async()=>{
  await expect(saveMyTpoNotificationPreferences(tpo,{...input,userId:"foreign"})).rejects.toThrow();
  await expect(saveMyTpoNotificationPreferences({...tpo,membership:{
   ...tpo.membership!,roles:["LEARNER"],
  }},input)).rejects.toThrow();
  await expect(saveMyTpoNotificationPreferences({...tpo,user:{
   ...tpo.user,platformStatus:"DISABLED",
  }},input)).rejects.toThrow();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("TPO-notifications-preferences-17 reports missing registration without claiming a saved setting",async()=>{
  vi.mocked(placementTableExists).mockResolvedValue(false);
  await expect(saveMyTpoNotificationPreferences(tpo,input)).rejects.toThrow("NOT_READY");
  expect(getDb).not.toHaveBeenCalled();
 });
 it("TPO-notifications-preferences-18 rechecks persisted active TPO inside the locked college transaction",async()=>{
  const f=mockDb(null);
  vi.mocked(assertPersistedPlatformPermission).mockResolvedValue({...tpo,membership:{
   ...tpo.membership!,roles:["LEARNER"],
  }});
  await expect(saveMyTpoNotificationPreferences(tpo,input)).rejects.toThrow("placements.manage");
  expect(f.tx.select).toHaveBeenCalledTimes(1);
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
 it("TPO-notifications-preferences-19 refuses stale versions without rewriting preferences or audit",async()=>{
  const f=mockDb({...input,updatedAt:new Date("2026-10-18T09:00:00Z"),
   morningDigest:false});
  await expect(saveMyTpoNotificationPreferences(tpo,input)).rejects.toThrow("STALE");
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
 it("TPO-notifications-preferences-20 makes one versioned first write and scoped audit event",async()=>{
  const f=mockDb(null);
  const result=await saveMyTpoNotificationPreferences(tpo,input);
  expect(result).toEqual({saved:true,version:"2026-10-18T12:00:00.000Z"});
  expect(f.prefValues).toHaveBeenCalledWith(expect.objectContaining({
   collegeId:college,userId:user,morningDigest:true,
  }));
  expect(f.auditValues).toHaveBeenCalledWith(expect.objectContaining({
   collegeId:college,organizationId:organization,actorUserId:user,
   eventType:"placements.tpo_notification_preferences.updated",
  }));
 });
});