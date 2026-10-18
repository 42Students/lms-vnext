import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {tpoCampaignDraftStorageReady} from "@/modules/messaging/tpo-campaign-draft-service";
import {tpoCampaignDispatchReady,dispatchTpoCampaign}
 from "@/modules/messaging/tpo-campaign-dispatch-service";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("@/modules/messaging/tpo-campaign-draft-service",()=>({
 tpoCampaignDraftStorageReady:vi.fn(),
 getTpoCampaignDraft:vi.fn(),
}));

const vars=[
 "TPO_CAMPAIGNS_READY","TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY",
 "TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET","TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET",
 "ZEPTOMAIL_TOKEN","ZEPTOMAIL_API_URL","ZEPTOMAIL_OTP_TEMPLATE_KEY",
 "APP_PUBLIC_URL",
] as const;
const originals=Object.fromEntries(vars.map(k=>[k,process.env[k]])) as Record<string,string|undefined>;
const officer:RequestContext={
 user:{id:"tpo",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:"college",organizationId:"org",status:"ACTIVE",roles:["TPO"]},
};
beforeEach(()=>{
 vi.clearAllMocks();
 for(const key of vars)delete process.env[key];
 Object.assign(process.env,{
  TPO_CAMPAIGNS_READY:"VERIFIED",
  TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY:"campaign.recruiter",
  TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET:"s".repeat(64),
  ZEPTOMAIL_TOKEN:"provider-fixture-token",
  ZEPTOMAIL_API_URL:"https://api.zeptomail.in/v1.1/email/template",
  ZEPTOMAIL_OTP_TEMPLATE_KEY:"auth.otp",
  APP_PUBLIC_URL:"https://42lms.com",
 });
 vi.mocked(tpoCampaignDraftStorageReady).mockResolvedValue(true);
});
afterEach(()=>{
 for(const key of vars){
  const value=originals[key];
  if(value===undefined)delete process.env[key];
  else process.env[key]=value;
 }
});

describe("chat-16 TPO campaign dispatch readiness and fail-closed tenant gate",()=>{
 it("tpo-dispatch-readiness-16 enables only a verified dedicated non-OTP template and registered storage",async()=>{
  await expect(tpoCampaignDispatchReady()).resolves.toBe(true);
  expect(tpoCampaignDraftStorageReady).toHaveBeenCalledTimes(1);
  vi.mocked(tpoCampaignDraftStorageReady).mockResolvedValue(false);
  await expect(tpoCampaignDispatchReady()).resolves.toBe(false);
 });
 it("tpo-dispatch-readiness-17 rejects missing provider verification, weak HMAC and OTP-key reuse before querying storage",async()=>{
  for(const [key,value] of [
   ["TPO_CAMPAIGNS_READY","DRAFT"],
   ["TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET","weak"],
   ["TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY","auth.otp"],
   ["TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY",""],
   ["ZEPTOMAIL_TOKEN",""],
   ["ZEPTOMAIL_API_URL","http://api.zeptomail.in/v1.1/email/template"],
  ] as const){
   const previous=process.env[key];
   process.env[key]=value;
   await expect(tpoCampaignDispatchReady(),key).resolves.toBe(false);
   process.env[key]=previous;
  }
  expect(tpoCampaignDraftStorageReady).not.toHaveBeenCalled();
 });
 it("tpo-dispatch-readiness-18 rejects public unsubscribe origins containing credentials, query, hash or insecure transport",async()=>{
  for(const origin of [
   "http://42lms.com","https://user:pass@42lms.com","https://42lms.com/path?next=bad",
   "https://42lms.com/#fragment","not-a-url",
  ]){
   process.env.APP_PUBLIC_URL=origin;
   await expect(tpoCampaignDispatchReady(),origin).resolves.toBe(false);
  }
  expect(tpoCampaignDraftStorageReady).not.toHaveBeenCalled();
 });
 it("tpo-dispatch-readiness-19 rejects an invalid campaign ID or unauthorized recruiter before a provider claim",async()=>{
  await expect(dispatchTpoCampaign(officer,"forged")).rejects.toThrow();
  const invalid:RequestContext={
   ...officer,membership:{...officer.membership!,roles:["LEARNER"]},
  };
  await expect(dispatchTpoCampaign(invalid,"11111111-1111-4111-8111-111111111111"))
   .rejects.toThrow("placements.manage");
  expect(tpoCampaignDraftStorageReady).not.toHaveBeenCalled();
 });
});
