import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {listTpoCampaignRecipientStatuses}
 from "@/modules/messaging/tpo-campaign-draft-service";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));

const campaignId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const user:RequestContext={
 user:{id:"tpo-user",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId,organizationId,status:"ACTIVE",roles:["TPO"]},
};
const wasReady=process.env.DB09_TPO_API_READY;
const row={id:"recipient-id",leadId:"lead-id",name:"Recruiter",
 status:"SENT" as const};
function fixture(found:boolean,rows:readonly typeof row[]){
 const campaignLimit=vi.fn(async()=>found?[{id:campaignId}]:[]);
 const recipientLimit=vi.fn(async()=>rows);
 const first=vi.fn(()=>({from:()=>({where:()=>({limit:campaignLimit})})}));
 const second=vi.fn(()=>({from:()=>({innerJoin:()=>({where:()=>({
  orderBy:()=>({limit:recipientLimit}),
 })})})}));
 const tx={select:vi.fn().mockImplementationOnce(first).mockImplementationOnce(second)};
 const db={execute:vi.fn(async()=>({rows:[{ready:true}]})),
  transaction:vi.fn(async(callback:(t:typeof tx)=>Promise<unknown>)=>callback(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {tx,db,campaignLimit,recipientLimit};
}
beforeEach(()=>{
 vi.clearAllMocks();
 process.env.DB09_TPO_API_READY="DB09_VERIFIED";
 vi.mocked(requirePlacementManageScope).mockResolvedValue({
  id:collegeId,organizationId,
 } as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(user);
});
afterEach(()=>{
 if(wasReady===undefined)delete process.env.DB09_TPO_API_READY;
 else process.env.DB09_TPO_API_READY=wasReady;
});

describe("chat-16 TPO campaign recipient status page service",()=>{
 it("tpo-campaign-status-16 denies malformed campaign ID and removed TPO membership without storage access",async()=>{
  await expect(listTpoCampaignRecipientStatuses(user,"/another-college")).rejects.toThrow();
  for(const ctx of [
   {...user,membership:null},
   {...user,membership:{...user.membership!,roles:["LEARNER"]}},
   {...user,user:{...user.user,platformStatus:"DISABLED" as const}},
  ]){
   await expect(listTpoCampaignRecipientStatuses(ctx,campaignId)).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("tpo-campaign-status-17 enforces current persisted permission before any campaign or recipient lookup",async()=>{
  const f=fixture(true,[row]);
  vi.mocked(assertPersistedPlatformPermission).mockRejectedValue(new Error("membership-revoked"));
  await expect(listTpoCampaignRecipientStatuses(user,campaignId))
   .rejects.toThrow("membership-revoked");
  expect(f.tx.select).not.toHaveBeenCalled();
 });
 it("tpo-campaign-status-18 never returns recipients for unknown or foreign campaign IDs",async()=>{
  const f=fixture(false,[row]);
  await expect(listTpoCampaignRecipientStatuses(user,campaignId))
   .resolves.toEqual({ready:false,rows:[]});
  expect(f.tx.select).toHaveBeenCalledTimes(1);
  expect(f.recipientLimit).not.toHaveBeenCalled();
 });
 it("tpo-campaign-status-19 projects only name, status and opaque IDs without contact addresses",async()=>{
  const f=fixture(true,[row]);
  const result=await listTpoCampaignRecipientStatuses(user,campaignId);
  expect(result).toMatchObject({ready:true,rows:[{id:"recipient-id",
   leadId:"lead-id",name:"Recruiter",status:"SENT"}],hasMore:false});
  expect(f.recipientLimit).toHaveBeenCalledWith(501);
  expect(JSON.stringify(result)).not.toContain("emailNorm");
  expect(JSON.stringify(result)).not.toContain("recipientKey");
  expect(JSON.stringify(result)).not.toContain("provider-token");
 });
 it("tpo-campaign-status-20 reports bounded list overflow rather than silently claiming the list is complete",async()=>{
  fixture(true,Array.from({length:501},(_,i)=>({...row,id:"r"+i})));
  const result=await listTpoCampaignRecipientStatuses(user,campaignId);
  expect(result).toMatchObject({ready:true,hasMore:true});
  expect(result.rows).toHaveLength(500);
 });
});