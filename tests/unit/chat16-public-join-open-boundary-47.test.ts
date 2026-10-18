import {beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {recordPublicJoinOpen} from "@/modules/placements/public-join/open-service";
import {POST} from "@/app/api/public/join-link/open/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/public-join/open-service",()=>({recordPublicJoinOpen:vi.fn()}));
const url="https://college.example.edu/api/public/join-link/open";
const token="a".repeat(43);
const req=(body:BodyInit)=>new Request(url,{
 method:"POST",headers:{"content-type":"application/json"},body,
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(recordPublicJoinOpen).mockResolvedValue(true);
});

describe("chat-16 public join-open telemetry must never mutate on untrusted requests",()=>{
 it("PUBLIC-JOIN-OPEN-47 denies hostile byte streams, malformed bodies and forged selector fields",async()=>{
  expect((await POST(req("é".repeat(5000)))).status).toBe(413);
  expect((await POST(req("{invalid-json"))).status).toBe(400);
  expect((await POST(req(JSON.stringify({token,scope:"COLLEGE",collegeId:"other"})))).status).toBe(400);
  expect(recordPublicJoinOpen).not.toHaveBeenCalled();
 });
 it("PUBLIC-JOIN-OPEN-48 uses a same-origin strict scoped POST, not an implicit GET mutation",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  expect((await POST(req(JSON.stringify({token,scope:"COMPANY"})))).status).toBe(403);
  expect(recordPublicJoinOpen).not.toHaveBeenCalled();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  const response=await POST(req(JSON.stringify({token,scope:"COMPANY"})));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({opened:true});
  expect(recordPublicJoinOpen).toHaveBeenCalledWith(token,"COMPANY");
 });
 it("PUBLIC-JOIN-OPEN-49 does not expose tenant storage errors to anonymous visitors",async()=>{
  vi.mocked(recordPublicJoinOpen).mockRejectedValue(new Error("private DB URL and key"));
  const response=await POST(req(JSON.stringify({token,scope:"COLLEGE"})));
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).not.toContain("private DB URL and key");
 });
});