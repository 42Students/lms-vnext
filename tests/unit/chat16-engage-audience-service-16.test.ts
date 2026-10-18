import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {previewEngageCampaignAudience,previewSelectedTpoCampaignAudience}
 from "@/modules/messaging/engage-audience-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));

const college="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const first="33333333-3333-4333-8333-333333333333";
const second="44444444-4444-4444-8444-444444444444";
const tpo:RequestContext={
 user:{id:"officer",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",organizationId:org,collegeId:college,status:"ACTIVE",roles:["TPO"]},
};
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(requirePlacementManageScope).mockResolvedValue({id:college,organizationId:org} as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(tpo);
});
function database<T>(rows:readonly T[]){
 const where=vi.fn(async()=>rows);
 const from=vi.fn(()=>({where}));
 const tx={select:vi.fn(()=>({from}))};
 const transaction=vi.fn(async(callback:(t:typeof tx)=>Promise<unknown>)=>callback(tx));
 vi.mocked(getDb).mockReturnValue({transaction} as unknown as ReturnType<typeof getDb>);
 return {tx,from,where,transaction};
}

describe("chat-16 count-only campaign audience preview authorization",()=>{
 it("engage-audience-16 denies a learner, inactive TPO and absent membership before any storage read",async()=>{
  const contexts:RequestContext[]=[
   {...tpo,membership:null},
   {...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}},
   {...tpo,membership:{...tpo.membership!,status:"SUSPENDED"}},
   {...tpo,user:{...tpo.user,platformStatus:"DISABLED"}},
  ];
  for(const ctx of contexts){
   await expect(previewEngageCampaignAudience(ctx,{})).rejects.toThrow();
   await expect(previewSelectedTpoCampaignAudience(ctx,{selectedLeadIds:[first]})).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("engage-audience-17 rejects invalid segment and mass-assigned tenant selection",async()=>{
  for(const raw of [
   {segment:"FOREIGN"},{segment:"ALL_ELIGIBLE",collegeId:"other-college"},
  ]){
   await expect(previewEngageCampaignAudience(tpo,raw)).rejects.toThrow();
  }
  for(const raw of [
   {selectedLeadIds:[]},{selectedLeadIds:[first,first]},
   {selectedLeadIds:Array.from({length:101},()=>first)},
   {selectedLeadIds:[first],collegeId:"other-college"},
  ]){
   await expect(previewSelectedTpoCampaignAudience(tpo,raw)).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("engage-audience-18 checks persisted TPO grant inside transaction before fetching contact facts",async()=>{
  const f=database([]);
  vi.mocked(assertPersistedPlatformPermission).mockRejectedValue(new Error("revoked"));
  await expect(previewSelectedTpoCampaignAudience(tpo,{selectedLeadIds:[first]}))
   .rejects.toThrow("revoked");
  expect(f.tx.select).not.toHaveBeenCalled();
  expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(f.tx,tpo,"placements.manage",{
   organizationId:org,collegeId:college,
  });
 });
 it("engage-audience-19 computes count-only selected preview without leaking emails or lead IDs",async()=>{
  const f=database([
   {id:first,emailNorm:"lead@example.org",manualStage:"NEW",
    ownerMembershipId:null,unsubscribedAt:null,inviteBouncedAt:null},
   {id:second,emailNorm:"lead@example.org",manualStage:"NEW",
    ownerMembershipId:null,unsubscribedAt:null,inviteBouncedAt:null},
  ]);
  const result=await previewSelectedTpoCampaignAudience(tpo,{selectedLeadIds:[first,second]});
  expect(result).toMatchObject({
   selected:2,eligible:1,leftOut:1,unavailable:0,
   suppressed:{DUPLICATE:1},
  });
  expect(JSON.stringify(result)).not.toContain("lead@example.org");
  expect(JSON.stringify(result)).not.toContain(first);
  expect(f.where).toHaveBeenCalledTimes(1);
 });
 it("engage-audience-20 provides aggregate totals only for current college",async()=>{
  database([{total:8,eligible:3,outsideSegment:1,
   bounced:1,unsubscribed:1,notNow:1,withoutEmail:1}]);
  const result=await previewEngageCampaignAudience(tpo,{segment:"NEW"});
  expect(result).toEqual({total:8,eligible:3,outsideSegment:1,
   bounced:1,unsubscribed:1,notNow:1,withoutEmail:1});
  expect(JSON.stringify(result)).not.toContain(first);
 });
});