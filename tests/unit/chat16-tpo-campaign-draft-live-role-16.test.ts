import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoCampaignDraft,listTpoCampaignDrafts} from "@/modules/messaging/tpo-campaign-draft-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));

const id="11111111-1111-4111-8111-111111111111";
const tpo:RequestContext={
 user:{id:"tpo",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:"college-a",organizationId:"org-a",status:"ACTIVE",roles:["TPO"]},
};
const originalReady=process.env.DB09_TPO_API_READY;
const prepareDb=()=>{
 const tx={execute:vi.fn(async()=>({rows:[]}))};
 const db={execute:vi.fn(async()=>({rows:[{ready:true}]})),
  transaction:vi.fn(async (callback:(t:typeof tx)=>Promise<unknown>)=>callback(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {db,tx};
};
beforeEach(()=>{
 vi.clearAllMocks();
 process.env.DB09_TPO_API_READY="DB09_VERIFIED";
 vi.mocked(requirePlacementManageScope).mockResolvedValue({
  id:"college-a",organizationId:"org-a",
 } as unknown as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(tpo);
});
afterEach(()=>{
 if(originalReady===undefined)delete process.env.DB09_TPO_API_READY;
 else process.env.DB09_TPO_API_READY=originalReady;
});

describe("chat-16 TPO campaign draft persisted-grant read protection",()=>{
 it("campaign-draft-read-16 denies learner and revoked sessions before storage probes",async()=>{
  const contexts:RequestContext[]=[
   {...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}},
   {...tpo,membership:null},
   {...tpo,user:{...tpo.user,platformStatus:"DISABLED"}},
   {...tpo,membership:{...tpo.membership!,status:"SUSPENDED"}},
  ];
  for(const context of contexts){
   await expect(listTpoCampaignDrafts(context)).rejects.toThrow();
   await expect(getTpoCampaignDraft(context,id)).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("campaign-draft-read-17 rechecks persisted TPO permissions before listing campaign subjects",async()=>{
  const {db,tx}=prepareDb();
  await expect(listTpoCampaignDrafts(tpo)).resolves.toEqual({ready:true,rows:[]});
  expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(tx,tpo,"placements.manage",{
   organizationId:"org-a",collegeId:"college-a",
  });
  expect(tx.execute).toHaveBeenCalledTimes(1);
  expect(db.transaction).toHaveBeenCalledTimes(1);
 });
 it("campaign-draft-read-18 denies stale revoked membership before disclosing campaign body",async()=>{
  const {tx}=prepareDb();
  vi.mocked(assertPersistedPlatformPermission).mockRejectedValue(new Error("Persisted membership revoked"));
  await expect(getTpoCampaignDraft(tpo,id)).rejects.toThrow("Persisted membership revoked");
  expect(tx.execute).not.toHaveBeenCalled();
 });
 it("campaign-draft-read-19 validates IDs and never reads another campaign for malformed input",async()=>{
  await expect(getTpoCampaignDraft(tpo,"../foreign")).resolves.toBeNull();
  expect(getDb).not.toHaveBeenCalled();
 });
});
