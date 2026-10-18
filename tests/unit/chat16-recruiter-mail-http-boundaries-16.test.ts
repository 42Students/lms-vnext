import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {acceptAuthenticatedRecruiterEmailReply}
 from "@/modules/placements/recruiter-message-email-inbound-service";
import {dispatchRecruiterUnreadMessageDigests}
 from "@/modules/placements/recruiter-message-email-dispatch-service";
import {POST as inboundPOST} from "@/app/api/internal/placements/recruiter-message-inbound/route";
import {POST as remindersPOST} from "@/app/api/internal/placements/recruiter-message-reminders/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/recruiter-message-email-inbound-service",()=>({
 acceptAuthenticatedRecruiterEmailReply:vi.fn(),
}));
vi.mock("@/modules/placements/recruiter-message-email-dispatch-service",()=>({
 dispatchRecruiterUnreadMessageDigests:vi.fn(),
}));

const apiBase="https://42lms.com/api/internal/placements";
const request=(kind:"inbound"|"reminders",body:string,headers:Record<string,string>={})=>
 new Request(apiBase+"/recruiter-message-"+kind,{
  method:"POST",body,headers,
 });
const original=process.env.RECRUITER_MESSAGE_WORKER_SECRET;
const secret="worker-test-secret-".repeat(4);

beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 process.env.RECRUITER_MESSAGE_WORKER_SECRET=secret;
});
afterEach(()=>{
 if(original===undefined)delete process.env.RECRUITER_MESSAGE_WORKER_SECRET;
 else process.env.RECRUITER_MESSAGE_WORKER_SECRET=original;
});

describe("chat-16 authenticated recruiter email inbound/worker HTTP boundaries",()=>{
 it("REC-INBOUND-HTTP-01 denies cross-origin webhook before reading or verifying raw content",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await inboundPOST(request("inbound","private-recruiter-message"));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"FORBIDDEN"});
  expect(acceptAuthenticatedRecruiterEmailReply).not.toHaveBeenCalled();
 });
 it("REC-INBOUND-HTTP-02 bounds raw webhook bytes before any HMAC verification",async()=>{
  const response=await inboundPOST(request("inbound","x".repeat(20_001)));
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({error:"INVALID_BODY"});
  expect(acceptAuthenticatedRecruiterEmailReply).not.toHaveBeenCalled();
 });
 it("REC-INBOUND-HTTP-03 forwards exact raw signed bytes and never trusts caller From alone",async()=>{
  const raw='{"from":"recruiter@example.org","to":"r-token@reply.example.org","text":"Hello"}';
  vi.mocked(acceptAuthenticatedRecruiterEmailReply).mockResolvedValue({
   accepted:false,replayed:false,
  });
  const response=await inboundPOST(request("inbound",raw,{
   "x-recruiter-mail-signature":"invalid",
  }));
  expect(response.status).toBe(403);
  expect(acceptAuthenticatedRecruiterEmailReply).toHaveBeenCalledExactlyOnceWith(raw,"invalid");
 });
 it("REC-INBOUND-HTTP-04 reports successful replay truthfully and returns no-cache headers",async()=>{
  vi.mocked(acceptAuthenticatedRecruiterEmailReply).mockResolvedValue({
   accepted:true,replayed:true,
  });
  const response=await inboundPOST(request("inbound","signed-body",{
   "x-recruiter-mail-signature":"signature",
  }));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({accepted:true,replayed:true});
 });
 it("REC-INBOUND-HTTP-05 hides webhook, database and provider exceptions from callers",async()=>{
  vi.mocked(acceptAuthenticatedRecruiterEmailReply).mockRejectedValue(
   new Error("private SMTP token and database details"),
  );
  const response=await inboundPOST(request("inbound","signed-body"));
  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).toBe('{"error":"SERVICE_UNAVAILABLE"}');
 });
 it("REC-WORKER-HTTP-06 rejects absent/short secret, incorrect bearer and cross-origin callers",async()=>{
  process.env.RECRUITER_MESSAGE_WORKER_SECRET="short";
  expect((await remindersPOST(request("reminders",""))).status).toBe(403);
  process.env.RECRUITER_MESSAGE_WORKER_SECRET=secret;
  expect((await remindersPOST(request("reminders","",{authorization:"Bearer incorrect"}))).status).toBe(403);
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  expect((await remindersPOST(request("reminders","",{authorization:"Bearer "+secret}))).status).toBe(403);
  expect(dispatchRecruiterUnreadMessageDigests).not.toHaveBeenCalled();
 });
 it("REC-WORKER-HTTP-07 schedules only after a valid worker secret and denies false send receipts",async()=>{
  vi.mocked(dispatchRecruiterUnreadMessageDigests).mockResolvedValue({
   examined:2,sent:0,enabled:true,
  });
  const response=await remindersPOST(request("reminders","",{authorization:"Bearer "+secret}));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({examined:2,sent:0,enabled:true});
  expect(dispatchRecruiterUnreadMessageDigests).toHaveBeenCalledOnce();
 });
 it("REC-WORKER-HTTP-08 avoids provider secret leakage if the authorized worker fails",async()=>{
  vi.mocked(dispatchRecruiterUnreadMessageDigests).mockRejectedValue(
   new Error("private mail tokens and database failure"),
  );
  const response=await remindersPOST(request("reminders","",{authorization:"Bearer "+secret}));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({error:"SERVICE_UNAVAILABLE"});
 });
});
