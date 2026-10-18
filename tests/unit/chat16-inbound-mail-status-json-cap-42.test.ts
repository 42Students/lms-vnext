import {beforeEach,describe,expect,it,vi} from "vitest";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {changeInboundMailStatusForAdmin} from "@/modules/inbound-mail/admin-service";
import {PATCH} from "@/app/api/admin/inbound-mail/status/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/inbound-mail/admin-service",()=>({changeInboundMailStatusForAdmin:vi.fn()}));
const id="11111111-1111-4111-8111-111111111111";
const url="https://lms.example.org/api/admin/inbound-mail/status";
const req=(body:BodyInit)=>new Request(url,{
 method:"PATCH",headers:{"content-type":"application/json"},body,
});
const payload=JSON.stringify({
 id,expectedStatus:"NEW",expectedVersion:0,status:"TRIAGED",
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentRequestContext).mockResolvedValue({
  user:{id:"sa",identityUid:"sa-uid",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
 });
 vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValue({
  kind:"UPDATED",id,status:"TRIAGED",version:1,
 });
});

describe("chat-16 global private inbound-mail status HTTP boundary",()=>{
 it("INBOUND-TRIAGE-SIZE-42 denies oversized UTF-8 without resolving a privileged session",async()=>{
  const response=await PATCH(req("é".repeat(5000)));
  expect(response.status).toBe(413);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(getCurrentRequestContext).not.toHaveBeenCalled();
  expect(changeInboundMailStatusForAdmin).not.toHaveBeenCalled();
 });
 it("INBOUND-TRIAGE-SIZE-43 rejects malformed input and wrong origin before service",async()=>{
  expect((await PATCH(req("{invalid"))).status).toBe(400);
  const invalid=new Request(url,{method:"PATCH",
   headers:{"content-type":"application/json"},
   body:new Blob([Uint8Array.of(0xff)]),
  });
  expect((await PATCH(invalid)).status).toBe(400);
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  expect((await PATCH(req(payload))).status).toBe(403);
  expect(changeInboundMailStatusForAdmin).not.toHaveBeenCalled();
 });
 it("INBOUND-TRIAGE-SIZE-44 preserves optimistic version result and friendly stale/no-storage states",async()=>{
  const ok=await PATCH(req(payload));
  expect(ok.status).toBe(200);
  expect(ok.headers.get("cache-control")).toBe("private, no-store");
  expect(await ok.json()).toEqual({kind:"UPDATED",id,status:"TRIAGED",version:1});
  expect(changeInboundMailStatusForAdmin).toHaveBeenCalledWith(
   expect.objectContaining({user:expect.objectContaining({id:"sa"})}),
   {id,expectedStatus:"NEW",expectedVersion:0,status:"TRIAGED"},
  );
  vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValueOnce({kind:"STALE"});
  expect((await PATCH(req(payload))).status).toBe(409);
  vi.mocked(changeInboundMailStatusForAdmin).mockResolvedValueOnce({kind:"UNAVAILABLE"});
  expect((await PATCH(req(payload))).status).toBe(503);
 });
});