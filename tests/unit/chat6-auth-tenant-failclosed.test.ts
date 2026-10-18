import {beforeEach,describe,expect,it,vi} from "vitest";
import {z} from "zod";
import {guardLoginRequest} from "@/modules/auth/http";
import {isSameOriginRequest} from "@/auth/origin";
import {allowRequest,clientIp} from "@/auth/ip-rate-limit";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/auth/ip-rate-limit",()=>({allowRequest:vi.fn(),clientIp:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));

const schema=z.object({contact:z.string()}).strict();
const req=()=>new Request("https://college.test/api/auth/login/start",{
  method:"POST",headers:{"host":"college.test","Content-Type":"application/json"},
  body:JSON.stringify({contact:"learner@example.test"}),
});
describe("AUTH-tenant-failclosed-01 college host domain outage",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(allowRequest).mockReturnValue(true);
  vi.mocked(clientIp).mockReturnValue("203.0.113.90");
 });
 it("denies tenant lookup failure instead of treating the host as platform",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unavailable",host:"college.test"});
  const outcome=await guardLoginRequest(req(),schema,"login-start",10);
  expect(outcome.ok).toBe(false);
  if(outcome.ok)throw new Error("Unexpected sign-in admission");
  expect(outcome.response.status).toBe(503);
  expect(outcome.response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await outcome.response.json()).toEqual({error:"TENANT_LOOKUP_UNAVAILABLE"});
  expect(outcome.response.headers.get("Retry-After")).toBe("30");
 });
 it("does not turn genuinely unknown college hosts into platform sign-in",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unknown",host:"unknown.test"});
  const outcome=await guardLoginRequest(req(),schema,"login-verify",10);
  expect(outcome.ok).toBe(false);
  if(outcome.ok)throw new Error("Unexpected sign-in admission");
  expect(outcome.response.status).toBe(404);
  expect(outcome.response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await outcome.response.json()).toEqual({error:"UNKNOWN_TENANT_HOST"});
 });
 it("AUTH-OTP-14 rejects forged login scope fields before tenant lookup and never caches 400",async()=>{
  const strict=z.object({contact:z.string()}).strict();
  const request=new Request("https://college.test/api/auth/login/start",{
    method:"POST",headers:{"host":"college.test","Content-Type":"application/json"},
    body:JSON.stringify({contact:"learner@example.test",collegeId:"forged"}),
  });
  const outcome=await guardLoginRequest(request,strict,"login-start",10);
  expect(outcome.ok).toBe(false);
  if(outcome.ok)throw new Error("Forged scope unexpectedly accepted");
  expect(outcome.response.status).toBe(400);
  expect(outcome.response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(resolveRequestTenant).not.toHaveBeenCalled();
 });
 it("AUTH-OTP-14 rejects foreign-origin and throttled requests with uncached recoverable responses",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const blocked=await guardLoginRequest(req(),schema,"login-start",10);
  expect(blocked.ok).toBe(false);
  if(blocked.ok)throw new Error("Unexpected origin admission");
  expect(blocked.response.status).toBe(403);
  expect(blocked.response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(allowRequest).not.toHaveBeenCalled();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(allowRequest).mockReturnValue(false);
  const throttled=await guardLoginRequest(req(),schema,"login-start",10);
  expect(throttled.ok).toBe(false);
  if(throttled.ok)throw new Error("Unexpected rate-limit admission");
  expect(throttled.response.status).toBe(429);
  expect(throttled.response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(throttled.response.headers.get("Retry-After")).toBe("60");
 });
 it("only explicitly configured platform hosts may use null tenantCollegeId",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"platform",host:"platform.test"});
  const platform=await guardLoginRequest(req(),schema,"login-start",10);
  expect(platform).toMatchObject({ok:true,tenantCollegeId:null});
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"college",host:"college.test",
    collegeId:"11111111-1111-4111-8111-111111111111",organizationId:"22222222-2222-4222-8222-222222222222"});
  const college=await guardLoginRequest(req(),schema,"login-start",10);
  expect(college).toMatchObject({ok:true,tenantCollegeId:"11111111-1111-4111-8111-111111111111"});
 });
});