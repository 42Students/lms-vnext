import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {isVerifiedHrReplyReceipt} from "@/modules/placements/hr-conversation-send-feedback-model";
const m=vi.hoisted(()=>({ctx:vi.fn(),origin:vi.fn(),send:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 sendRecruiterThreadMessage:m.send,TpoMessagingError:class TpoMessagingError extends Error{},
}));
import {POST} from "@/app/api/placements/recruiter/conversations/[threadId]/reply/route";
const threadId="11111111-1111-4111-8111-111111111111";
const messageId="22222222-2222-4222-8222-222222222222";
function request(asJson:boolean,body="Hello"){
 const form=new FormData();form.set("body",body);
 return new Request("https://lms.invalid/api/placements/recruiter/conversations/"+threadId+"/reply",{
  method:"POST",body:form,headers:asJson?{Accept:"application/json"}:undefined,
 });
}
const route=(req:Request)=>POST(req,{params:Promise.resolve({threadId})});
describe("HR-BREAK-CONVO-RECEIPT-49: persisted recruiter message receipt",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();m.origin.mockReturnValue(true);
  m.ctx.mockResolvedValue({user:{id:"recruiter",platformStatus:"ACTIVE"},
   recruiter:{userId:"recruiter",status:"ACTIVE"}});
  m.send.mockResolvedValue({id:messageId,threadId});
 });
 it("returns exact persisted reply ID and thread ID",async()=>{
  const response=await route(request(true));
  expect(response.status).toBe(200);
  const payload:unknown=await response.json();
  expect(payload).toEqual({sent:true,id:messageId,threadId});
  expect(isVerifiedHrReplyReceipt(payload,threadId)).toBe(true);
  expect(m.send).toHaveBeenCalledWith(expect.anything(),threadId,"Hello");
 });
 it("keeps the 303 native form fallback",async()=>{
  const response=await route(request(false));
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toContain("/hr/conversations/"+threadId);
 });
 it("denies cross-origin posts without writing",async()=>{
  m.origin.mockReturnValue(false);
  const response=await route(request(true));
  expect(response.status).toBe(403);
  expect(m.ctx).not.toHaveBeenCalled();
  expect(m.send).not.toHaveBeenCalled();
 });
 it("denies mismatched recruiter principal before persistence",async()=>{
  m.ctx.mockResolvedValue({user:{id:"recruiter",platformStatus:"ACTIVE"},
   recruiter:{userId:"other",status:"ACTIVE"}});
  const response=await route(request(true));
  expect(response.status).toBe(403);
  expect(m.send).not.toHaveBeenCalled();
 });
 it.each([null,true,"<html>Sign in</html>",{sent:true},
  {sent:true,threadId,id:"not-a-uuid"},
  {sent:false,threadId,id:messageId},
  {sent:true,threadId:"33333333-3333-4333-8333-333333333333",id:messageId},
 ])("rejects unverified message receipt %j",raw=>{
  expect(isVerifiedHrReplyReceipt(raw,threadId)).toBe(false);
 });
 it("client cannot mistake generic redirected 200 for sent",()=>{
  const src=readFileSync("src/components/hr/recruiter-conversation-reply-form.tsx","utf8");
  expect(src).toContain('redirect:"error"');
  expect(src).toContain('Accept:"application/json"');
  expect(src).toContain("isVerifiedHrReplyReceipt(receipt,threadId)");
  expect(src).not.toContain("response.redirected");
 });
});
