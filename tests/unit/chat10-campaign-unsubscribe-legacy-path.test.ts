import {beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient}
 from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import {POST} from "@/app/api/v1/public/campaign-unsubscribe/[token]/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/messaging/tpo-campaign-unsubscribe-service",()=>({
 CampaignUnsubscribeInvalid:class CampaignUnsubscribeInvalid extends Error {},
 unsubscribeTpoCampaignRecipient:vi.fn(),
}));
const request=()=>new Request(
 "https://42lms.com/api/v1/public/campaign-unsubscribe/opaque-token",{method:"POST"},
);
const params={params:Promise.resolve({token:"opaque-token"})};
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(unsubscribeTpoCampaignRecipient).mockResolvedValue({unsubscribed:true});
});
describe("W1-1 legacy path-bound campaign unsubscribe contract",()=>{
 it("sends the opaque token to the scoped suppression writer and returns JSON200",async()=>{
  const response=await POST(request(),params);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({status:"UNSUBSCRIBED"});
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(unsubscribeTpoCampaignRecipient).toHaveBeenCalledExactlyOnceWith("opaque-token");
 });
 it("treats revoked/used recipient identifiers as an idempotent success",async()=>{
  vi.mocked(unsubscribeTpoCampaignRecipient)
   .mockRejectedValue(new CampaignUnsubscribeInvalid());
  const response=await POST(request(),params);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({status:"UNSUBSCRIBED"});
 });
 it("never labels temporary storage failures as successful opt-outs",async()=>{
  vi.mocked(unsubscribeTpoCampaignRecipient)
   .mockRejectedValue(new Error("TPO_CAMPAIGNS_NOT_REGISTERED"));
  const response=await POST(request(),params);
  expect(response.status).toBe(503);
  expect(response.ok).toBe(false);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({
   error:"SUPPRESSIONS_NOT_READY",message:"That didn't work. Please try again.",
  });
  expect(unsubscribeTpoCampaignRecipient).toHaveBeenCalledExactlyOnceWith("opaque-token");
 });
 it("rejects cross-origin POST before resolving a recipient",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await POST(request(),params);
  expect(response.status).toBe(403);
  expect(unsubscribeTpoCampaignRecipient).not.toHaveBeenCalled();
 });
});
