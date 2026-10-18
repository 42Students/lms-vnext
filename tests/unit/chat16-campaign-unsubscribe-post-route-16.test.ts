import {beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {isSameOriginRequest} from "@/auth/origin";
import {verifyUnsubscribeToken} from "@/modules/messaging/unsubscribe-model";
import {verifyTpoCampaignRecipientToken} from "@/modules/messaging/tpo-campaign-recipient-token";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient}
 from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import {POST} from "@/app/api/public/campaign-unsubscribe/route";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/messaging/unsubscribe-model",()=>({verifyUnsubscribeToken:vi.fn()}));
vi.mock("@/modules/messaging/tpo-campaign-recipient-token",()=>({
 verifyTpoCampaignRecipientToken:vi.fn(),
 resolveTpoCampaignRecipientSecret:vi.fn(()=>"safe-claimed-secret"),
}));
vi.mock("@/modules/messaging/tpo-campaign-unsubscribe-service",()=>({
 CampaignUnsubscribeInvalid:class CampaignUnsubscribeInvalid extends Error {},
 unsubscribeTpoCampaignRecipient:vi.fn(),
}));

const url="https://42lms.com/api/public/campaign-unsubscribe";
const token="signed-token";
const request=(value:string|null=token)=>{
 const data=new FormData();
 if(value!==null)data.set("token",value);
 return new Request(url,{method:"POST",body:data});
};
const recipientKey="a".repeat(64);
const college="11111111-1111-4111-8111-111111111111";
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(verifyUnsubscribeToken).mockReturnValue(null);
 vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue(null);
});

describe("chat-16 explicit public campaign suppression API response and side effects",()=>{
 it("campaign-unsubscribe-route-16 denies cross-origin POST before token verification or storage",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await POST(request());
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(verifyUnsubscribeToken).not.toHaveBeenCalled();
  expect(verifyTpoCampaignRecipientToken).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-17 rejects absent, unsigned and huge tokens without falsely confirming removal",async()=>{
  const results=await Promise.all([request(null),request("not-signed"),request("x".repeat(2049))]
   .map(req=>POST(req)));
  expect(results.map(result=>result.status)).toEqual([400,400,400]);
  for(const response of results)expect(await response.json()).toEqual({error:"INVALID_OR_EXPIRED_LINK"});
  expect(getDb).not.toHaveBeenCalled();
  expect(unsubscribeTpoCampaignRecipient).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-18 keeps placement-cell opt-outs on their signed, scoped service path",async()=>{
  vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue({
   v:1,collegeId:college,campaignId:college,recipientId:college,expiresAt:4102444800000,
  });
  vi.mocked(unsubscribeTpoCampaignRecipient).mockResolvedValue({unsubscribed:true});
  const response=await POST(request());
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://42lms.com/campaign-unsubscribe/confirmed?scope=placement-cell");
  expect(unsubscribeTpoCampaignRecipient).toHaveBeenCalledExactlyOnceWith(token);
  expect(getDb).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-19 returns 400 when the locked campaign recipient no longer exists",async()=>{
  vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue({
   v:1,collegeId:college,campaignId:college,recipientId:college,expiresAt:4102444800000,
  });
  vi.mocked(unsubscribeTpoCampaignRecipient).mockRejectedValue(new CampaignUnsubscribeInvalid());
  const response=await POST(request());
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({error:"INVALID_OR_EXPIRED_LINK"});
  expect(getDb).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-20 distinguishes unregistered global suppression storage from successful opt-out",async()=>{
  vi.mocked(verifyUnsubscribeToken).mockReturnValue({
   version:1,recipientKey,expiresAt:4102444800000,
  });
  const execute=vi.fn(async()=>({rows:[{ready:false}]}));
  vi.mocked(getDb).mockReturnValue({execute} as unknown as ReturnType<typeof getDb>);
  const response=await POST(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({error:"SUPPRESSIONS_NOT_READY"});
  expect(execute).toHaveBeenCalledTimes(1);
  expect(unsubscribeTpoCampaignRecipient).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-21 stores only a signed opaque global recipient key, never a caller address",async()=>{
  vi.mocked(verifyUnsubscribeToken).mockReturnValue({
   version:1,recipientKey,expiresAt:4102444800000,
  });
  const execute=vi.fn().mockResolvedValueOnce({rows:[{ready:true}]}).mockResolvedValueOnce({rows:[]});
  vi.mocked(getDb).mockReturnValue({execute} as unknown as ReturnType<typeof getDb>);
  const response=await POST(request());
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://42lms.com/campaign-unsubscribe/confirmed");
  expect(execute).toHaveBeenCalledTimes(2);
  expect(verifyUnsubscribeToken).toHaveBeenCalledWith(token,expect.any(String),expect.any(Number));
  expect(unsubscribeTpoCampaignRecipient).not.toHaveBeenCalled();
 });
});
