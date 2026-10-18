import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {createTpoCampaignDraft} from "@/modules/messaging/tpo-campaign-draft-service";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));
const college="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const campaign="33333333-3333-4333-8333-333333333333";
const lead="44444444-4444-4444-8444-444444444444";
const user="55555555-5555-4555-8555-555555555555";
const tpo:RequestContext={
 user:{id:user,identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:college,organizationId:org,status:"ACTIVE",roles:["TPO"]},
};
const draft={title:"Campus opportunities",subject:"Hiring notice",body:"Hello {name}",
 segment:"ALL_ELIGIBLE",templateKey:"campaign.recruiter",selectedLeadIds:[lead]};
const envOriginal={ready:process.env.DB09_TPO_API_READY,secret:process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET};
type Contact={id:string;emailNorm:string|null;unsubscribedAt:Date|null;
 inviteBouncedAt:Date|null;manualStage:string;ownerMembershipId:string|null};
const contact:Contact={id:lead,emailNorm:"LEAD@Example.ORG",unsubscribedAt:null,inviteBouncedAt:null,
 manualStage:"NEW",ownerMembershipId:null};
function mockStorage(contacts:readonly Contact[]){
 const recipientValues=vi.fn(async(_input:unknown)=>undefined);
 const campaignValues=vi.fn(()=>({returning:vi.fn(async()=>[{id:campaign}])}));
 const insert=vi.fn().mockReturnValueOnce({values:campaignValues})
  .mockReturnValueOnce({values:recipientValues});
 const select=vi.fn(()=>({from:vi.fn(()=>({where:vi.fn(async()=>contacts)}))}));
 const tx={select,insert,execute:vi.fn(async()=>({rows:[{ready:true}]}))};
 const db={execute:vi.fn(async()=>({rows:[{ready:true}]})),
  transaction:vi.fn(async(cb:(t:typeof tx)=>Promise<unknown>)=>cb(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {tx,db,campaignValues,recipientValues};
}
beforeEach(()=>{
 vi.clearAllMocks();
 process.env.DB09_TPO_API_READY="DB09_VERIFIED";
 process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET="s".repeat(64);
 vi.mocked(requirePlacementManageScope).mockResolvedValue({id:college,organizationId:org} as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(undefined);
});
afterEach(()=>{
 if(envOriginal.ready===undefined)delete process.env.DB09_TPO_API_READY;
 else process.env.DB09_TPO_API_READY=envOriginal.ready;
 if(envOriginal.secret===undefined)delete process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET;
 else process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET=envOriginal.secret;
});
describe("chat-16 TPO campaign draft create and consent snapshot",()=>{
 it("tpo-campaign-draft-16 rejects an OTP template, wrong role and missing draft values before database mutation",async()=>{
  await expect(createTpoCampaignDraft(tpo,{...draft,templateKey:"auth.otp"})).rejects.toThrow();
  await expect(createTpoCampaignDraft({...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}},draft))
   .rejects.toThrow();
  await expect(createTpoCampaignDraft(tpo,{...draft,selectedLeadIds:[lead,lead]})).rejects.toThrow();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("tpo-campaign-draft-17 checks current persisted TPO permission before collecting or persisting contacts",async()=>{
  const f=mockStorage([contact]);
  vi.mocked(assertPersistedPlatformPermission).mockRejectedValue(new Error("revoked"));
  await expect(createTpoCampaignDraft(tpo,draft)).rejects.toThrow("revoked");
  expect(f.tx.select).not.toHaveBeenCalled();
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
 it("tpo-campaign-draft-18 refuses missing selected leads, instead of silently mailing the wrong audience",async()=>{
  const f=mockStorage([]);
  await expect(createTpoCampaignDraft(tpo,draft)).rejects.toThrow("INVALID_SELECTION");
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
 it("tpo-campaign-draft-19 requires at least one live eligible recipient",async()=>{
  const f=mockStorage([{...contact,unsubscribedAt:new Date("2026-10-18T00:00:00Z")}]);
  await expect(createTpoCampaignDraft(tpo,draft)).rejects.toThrow("NO_RECIPIENTS");
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
 it("tpo-campaign-draft-20 persists only keyed recipient address and an immutable draft (no delivery)",async()=>{
  const f=mockStorage([contact]);
  const result=await createTpoCampaignDraft(tpo,draft);
  expect(result).toMatchObject({campaignId:campaign,recipients:1,status:"DRAFT"});
  expect(f.campaignValues).toHaveBeenCalledWith(expect.objectContaining({
   collegeId:college,status:"DRAFT",totalRecipients:1,
  }));
  const saved=f.recipientValues.mock.calls[0]?.[0] as Array<{
   collegeId:string;leadId:string;recipientKey:string;status:string;
  }>;
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({collegeId:college,leadId:lead,status:"PENDING"});
  expect(saved[0]?.recipientKey).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.stringify(saved)).not.toContain("LEAD@Example.ORG");
  expect(f.tx.execute).toHaveBeenCalledOnce();
 });
});