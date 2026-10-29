import {beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {verifyUnsubscribeToken} from "@/modules/messaging/unsubscribe-model";
import {verifyTpoCampaignRecipientToken} from "@/modules/messaging/tpo-campaign-recipient-token";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient}
 from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import {POST} from "@/app/api/public/campaign-unsubscribe/route";
import {POST as POSTPathCompat} from "@/app/api/public/campaign-unsubscribe/[token]/route";
import {POST as POSTLegacy} from "@/app/api/v1/public/campaign-unsubscribe/[token]/route";
import {GlobalEmailSuppressionUnavailable,persistVerifiedGlobalEmailSuppression} from "@/modules/operations/global-email-suppression-service";

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
vi.mock("@/modules/operations/global-email-suppression-service",()=>({
 GlobalEmailSuppressionUnavailable:class GlobalEmailSuppressionUnavailable extends Error {},
 persistVerifiedGlobalEmailSuppression:vi.fn(),
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
 vi.mocked(persistVerifiedGlobalEmailSuppression).mockReset();
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
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-17 rejects absent, unsigned and huge tokens without falsely confirming removal",async()=>{
  const results=await Promise.all([request(null),request("not-signed"),request("x".repeat(2049))]
   .map(req=>POST(req)));
  expect(results.map(result=>result.status)).toEqual([303,303,303]);
  for(const response of results)
   expect(response.headers.get("location")).toBe("https://42lms.com/campaign-unsubscribe/confirmed?scope=placement-cell");
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
  expect(unsubscribeTpoCampaignRecipient).toHaveBeenCalledExactlyOnceWith("not-signed");
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
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-19 returns 400 when the locked campaign recipient no longer exists",async()=>{
  vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue({
   v:1,collegeId:college,campaignId:college,recipientId:college,expiresAt:4102444800000,
  });
  vi.mocked(unsubscribeTpoCampaignRecipient).mockRejectedValue(new CampaignUnsubscribeInvalid());
  const response=await POST(request());
  // A revoked recipient is indistinguishable from a completed opt-out.
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://42lms.com/campaign-unsubscribe/confirmed?scope=placement-cell");
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
 it("W1-1 signed recruiter unsubscribe never reports success when recipient migration is unavailable",async()=>{
  vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue({
   v:1,collegeId:college,campaignId:college,recipientId:college,expiresAt:4102444800000,
  });
  vi.mocked(unsubscribeTpoCampaignRecipient)
   .mockRejectedValue(new Error("TPO_CAMPAIGNS_NOT_REGISTERED"));
  const response=await POST(request());
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
   error:"SUPPRESSIONS_NOT_READY",message:"That didn't work. Please try again.",
  });
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-20 refuses false success when atomic suppression storage is unavailable",async()=>{
  vi.mocked(verifyUnsubscribeToken).mockReturnValue({
   version:1,recipientKey,expiresAt:4102444800000,
  });
  vi.mocked(persistVerifiedGlobalEmailSuppression).mockRejectedValue(
   new GlobalEmailSuppressionUnavailable());
  const response=await POST(request("signed.global-token"));
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
   error:"SUPPRESSIONS_NOT_READY",message:"That didn't work. Please try again.",
  });
  expect(persistVerifiedGlobalEmailSuppression).toHaveBeenCalledExactlyOnceWith({
   recipientHash:recipientKey,reason:"UNSUBSCRIBED",
  });
  expect(unsubscribeTpoCampaignRecipient).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-21 only sends a signed global hash to the atomic suppression writer",async()=>{
  vi.mocked(verifyUnsubscribeToken).mockReturnValue({
   version:1,recipientKey,expiresAt:4102444800000,
  });
  vi.mocked(persistVerifiedGlobalEmailSuppression).mockResolvedValue();
  const response=await POST(request("signed.global-token"));
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://42lms.com/campaign-unsubscribe/confirmed");
  expect(persistVerifiedGlobalEmailSuppression).toHaveBeenCalledExactlyOnceWith({
   recipientHash:recipientKey,reason:"UNSUBSCRIBED",
  });
  expect(verifyUnsubscribeToken).toHaveBeenCalledWith(
   "signed.global-token",expect.any(String),expect.any(Number));
  expect(unsubscribeTpoCampaignRecipient).not.toHaveBeenCalled();
 });
 it("campaign-unsubscribe-route-21b never starts global cancellation from an invalid token",async()=>{
  vi.mocked(verifyUnsubscribeToken).mockReturnValue(null);
  const response=await POST(request("opaque.invalid.global"));
  expect(response.status).toBe(303);
  expect(persistVerifiedGlobalEmailSuppression).not.toHaveBeenCalled();
 });
 it("W1-1 preserves the verified Host when the path-token adapter forwards to the durable suppression writer",async()=>{
  vi.mocked(isSameOriginRequest).mockImplementation(req=>
   req.headers.get("host")==="42lms.com" &&
   req.headers.get("origin")==="https://42lms.com");
  vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue({
   v:1,collegeId:college,campaignId:college,recipientId:college,expiresAt:4102444800000,
  });
  vi.mocked(unsubscribeTpoCampaignRecipient).mockResolvedValue({unsubscribed:true});
  const response=await POSTPathCompat(new Request(
   "https://42lms.com/api/public/campaign-unsubscribe/signed-token",{
    method:"POST",headers:{host:"42lms.com",origin:"https://42lms.com"},
   }),{params:Promise.resolve({token})});
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({status:"UNSUBSCRIBED"});
  expect(unsubscribeTpoCampaignRecipient).toHaveBeenCalledExactlyOnceWith(token);
 });
 it("W1-1 never confirms legacy-path unsubscribe when its recipient migration is missing",async()=>{
  vi.mocked(unsubscribeTpoCampaignRecipient)
   .mockRejectedValue(new Error("TPO_CAMPAIGNS_NOT_REGISTERED"));
  const response=await POSTLegacy(new Request(
   "https://42lms.com/api/v1/public/campaign-unsubscribe/signed-token",{
    method:"POST",headers:{host:"42lms.com",origin:"https://42lms.com"},
   }),{params:Promise.resolve({token})});
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toMatchObject({error:"SUPPRESSIONS_NOT_READY"});
 });

});
