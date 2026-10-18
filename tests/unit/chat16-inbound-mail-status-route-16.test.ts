import {beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {changeInboundMailStatusForAdmin} from "@/modules/inbound-mail/admin-service";
import {PATCH} from "@/app/api/admin/inbound-mail/status/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/inbound-mail/admin-service",()=>({changeInboundMailStatusForAdmin:vi.fn()}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:vi.fn(()=>Response.json({error:"Request could not be completed"},{status:500})),
}));

const payload={
 id:"11111111-1111-4111-8111-111111111111",expectedStatus:"NEW",
 expectedVersion:1,status:"RESOLVED",
};
const send=(input:unknown=payload)=>new Request("https://college.example.edu/api/admin/inbound-mail/status",{
 method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentRequestContext).mockResolvedValue({
  user:{id:"admin",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
 });
});

describe("chat-16 private inbound-mail status route",()=>{
 it("inbound-mail-route-16 rejects cross-origin writes before body or session access",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const result=await PATCH(send());
  expect(result.status).toBe(403);
  expect(await result.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(getCurrentRequestContext).not.toHaveBeenCalled();
  expect(changeInboundMailStatusForAdmin).not.toHaveBeenCalled();
 });
 it("inbound-mail-route-17 maps an optimistic conflict to a 409 without a fake success",async()=>{
  vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({kind:"STALE"});
  const result=await PATCH(send());
  expect(result.status).toBe(409);
  expect(await result.json()).toEqual({error:"MESSAGE_CHANGED"});
 });
 it("inbound-mail-route-18 distinguishes unavailable storage from an empty mailbox",async()=>{
  vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({kind:"UNAVAILABLE"});
  const result=await PATCH(send());
  expect(result.status).toBe(503);
  expect(await result.json()).toEqual({error:"INBOUND_MAIL_STORAGE_UNAVAILABLE"});
 });
 it("inbound-mail-route-19 returns only persisted version and state on successful mutation",async()=>{
  vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({
   kind:"UPDATED",id:payload.id,status:"RESOLVED",version:2,
  });
  const result=await PATCH(send());
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await result.json()).toMatchObject({
   kind:"UPDATED",id:payload.id,status:"RESOLVED",version:2,
  });
  expect(changeInboundMailStatusForAdmin).toHaveBeenCalledWith(
   expect.objectContaining({user:expect.objectContaining({id:"admin"})}),payload,
  );
 });
 it("inbound-mail-route-21 projects a persisted versioned TRIAGED result",async()=>{
  const input={...payload,status:"TRIAGED"};
  vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({
   kind:"UPDATED",id:payload.id,status:"TRIAGED",version:2,
  });
  const result=await PATCH(send(input));
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({status:"TRIAGED",version:2});
  expect(changeInboundMailStatusForAdmin).toHaveBeenCalledWith(
   expect.objectContaining({user:expect.objectContaining({id:"admin"})}),input,
  );
 });
 it("inbound-mail-route-20 uses the shared safe error response for invalid bodies and session failures",async()=>{
  vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("opaque credential"));
  const result=await PATCH(send());
  expect(result.status).toBe(500);
  expect(JSON.stringify(await result.json())).not.toContain("opaque credential");
  expect(apiErrorResponse).toHaveBeenCalledTimes(1);
 });
});
