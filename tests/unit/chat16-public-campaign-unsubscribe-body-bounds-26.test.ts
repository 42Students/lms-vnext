import {beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {getDb} from "@/db/client";
import {verifyUnsubscribeToken} from "@/modules/messaging/unsubscribe-model";
import {verifyTpoCampaignRecipientToken} from "@/modules/messaging/tpo-campaign-recipient-token";
import {unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import {POST} from "@/app/api/public/campaign-unsubscribe/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/messaging/unsubscribe-model",()=>({verifyUnsubscribeToken:vi.fn()}));
vi.mock("@/modules/messaging/tpo-campaign-recipient-token",()=>({
 verifyTpoCampaignRecipientToken:vi.fn(),
 resolveTpoCampaignRecipientSecret:vi.fn(()=>"test-only-signing-secret"),
}));
vi.mock("@/modules/messaging/tpo-campaign-unsubscribe-service",()=>({
 CampaignUnsubscribeInvalid:class CampaignUnsubscribeInvalid extends Error{},
 unsubscribeTpoCampaignRecipient:vi.fn(),
}));
const url="https://college.example.edu/api/public/campaign-unsubscribe";
const formRequest=(token:string)=>new Request(url,{
 method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
 body:new URLSearchParams({token}),
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue(null);
 vi.mocked(verifyUnsubscribeToken).mockReturnValue(null);
 vi.mocked(unsubscribeTpoCampaignRecipient).mockResolvedValue({unsubscribed:true});
});

describe("chat-16 public campaign opt-out body limit and POST-only persistence",()=>{
 it("PUBLIC-UNSUB-SIZE-26 rejects oversized URL-encoded POST before signature or database lookup",async()=>{
  const response=await POST(formRequest("x".repeat(9000)));
  expect(response.status).toBe(413);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(verifyTpoCampaignRecipientToken).not.toHaveBeenCalled();
  expect(verifyUnsubscribeToken).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("PUBLIC-UNSUB-SIZE-27 rejects invalid UTF-8 and malformed forms before privileged lookups",async()=>{
  const invalid=new Request(url,{
   method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
   body:new Blob([Uint8Array.of(0xff,0xfe)]),
  });
  expect((await POST(invalid)).status).toBe(400);
  expect((await POST(new Request(url,{
   method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({other:"no-token"}),
  }))).status).toBe(400);
  expect(verifyTpoCampaignRecipientToken).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("PUBLIC-UNSUB-SIZE-28 preserves multipart signed opt-out and confirmed redirect",async()=>{
  vi.mocked(verifyTpoCampaignRecipientToken).mockReturnValue({
   v:1,collegeId:"11111111-1111-4111-8111-111111111111",
   campaignId:"22222222-2222-4222-8222-222222222222",
   recipientId:"33333333-3333-4333-8333-333333333333",
   expiresAt:4102444800000,
  });
  const body=new FormData();
  body.set("token","signed-token");
  const response=await POST(new Request(url,{method:"POST",body}));
  expect(response.status).toBe(303);
  expect(response.headers.get("location"))
   .toBe("https://college.example.edu/campaign-unsubscribe/confirmed?scope=placement-cell");
  expect(unsubscribeTpoCampaignRecipient).toHaveBeenCalledWith("signed-token");
 });
 it("PUBLIC-UNSUB-SIZE-29 denies cross-origin posts before even touching the request body",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await POST(formRequest("x".repeat(9000)));
  expect(response.status).toBe(403);
  expect(verifyTpoCampaignRecipientToken).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
});
