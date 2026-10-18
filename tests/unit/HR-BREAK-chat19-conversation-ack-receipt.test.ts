import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {isVerifiedRecruiterThreadAcknowledgement} from
 "@/modules/placements/recruiter-thread-ack-receipt-model";
const mock=vi.hoisted(()=>({ctx:vi.fn(),origin:vi.fn(),ack:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mock.origin}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 acknowledgeRecruiterThread:mock.ack,
 TpoMessagingError:class TpoMessagingError extends Error{},
}));
import {POST} from "@/app/api/placements/recruiter/conversations/[threadId]/acknowledge/route";
const threadId="11111111-1111-4111-8111-111111111111";
const otherId="22222222-2222-4222-8222-222222222222";
const invoke=(asJson:boolean,id=threadId)=>POST(new Request(
 "https://lms.invalid/api/placements/recruiter/conversations/"+id+"/acknowledge",{
 method:"POST",headers:asJson?{Accept:"application/json"}:undefined,
}),{params:Promise.resolve({threadId:id})});

describe("HR-BREAK-CONVO-ACK-53: only persisted own-thread read receipts confirm acknowledgement",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.origin.mockReturnValue(true);
  mock.ctx.mockResolvedValue({user:{id:"recruiter",platformStatus:"ACTIVE"},
   recruiter:{userId:"recruiter",status:"ACTIVE"}});
  mock.ack.mockResolvedValue({acknowledged:2});
 });
 it("returns a scoped JSON receipt after the authorized persisted write",async()=>{
  const response=await invoke(true);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  const result:unknown=await response.json();
  expect(result).toEqual({saved:true,threadId,acknowledged:2});
  expect(isVerifiedRecruiterThreadAcknowledgement(result,threadId)).toBe(true);
  expect(mock.ack).toHaveBeenCalledWith(expect.anything(),threadId);
 });
 it("returns a successful idempotent zero-count acknowledgement without fabricating new reads",async()=>{
  mock.ack.mockResolvedValue({acknowledged:0});
  const response=await invoke(true);
  expect(isVerifiedRecruiterThreadAcknowledgement(await response.json(),threadId)).toBe(true);
 });
 it("retains browser-native 303 fallback while fetch receives no redirect",async()=>{
  const response=await invoke(false);
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toContain("/hr/conversations/"+threadId);
 });
 it("rejects cross-origin requests before loading any private context",async()=>{
  mock.origin.mockReturnValue(false);
  const response=await invoke(true);
  expect(response.status).toBe(403);
  expect(mock.ctx).not.toHaveBeenCalled();
  expect(mock.ack).not.toHaveBeenCalled();
 });
 it("rejects revoked and wrong-principal recruiter access",async()=>{
  mock.ctx.mockResolvedValue({user:{id:"recruiter",platformStatus:"ACTIVE"},
   recruiter:{userId:"someone-else",status:"ACTIVE"}});
  const response=await invoke(true);
  expect(response.status).toBe(403);
  expect(mock.ack).not.toHaveBeenCalled();
 });
 it("rejects invalid thread IDs before any permission or data read",async()=>{
  const response=await invoke(true,"bad-id");
  expect(response.status).toBe(404);
  expect(mock.ctx).not.toHaveBeenCalled();
  expect(mock.ack).not.toHaveBeenCalled();
 });
 it.each([null,{},[],true,"<html>Sign in</html>",
  {saved:true,threadId,acknowledged:-1},
  {saved:true,threadId,acknowledged:0.2},
  {saved:true,threadId,acknowledged:"1"},
  {saved:false,threadId,acknowledged:1},
  {saved:true,threadId:otherId,acknowledged:1},
 ])("does not trust unrelated/malformed/HTML read confirmations %j",payload=>{
  expect(isVerifiedRecruiterThreadAcknowledgement(payload,threadId)).toBe(false);
 });
 it("both on-open and manual controls wait for the exact JSON receipt",()=>{
  const src=readFileSync("src/components/hr/recruiter-conversation-read-control.tsx","utf8");
  expect(src).toContain("isVerifiedRecruiterThreadAcknowledgement(payload,threadId)");
  expect(src.match(/isVerifiedRecruiterThreadAcknowledgement\(payload,threadId\)/g)?.length)
   .toBe(2);
  expect(src).toContain('redirect:"error"');
  expect(src).toContain('Accept:"application/json"');
  expect(src).not.toContain("if(response.ok)router.refresh()");
 });
});
