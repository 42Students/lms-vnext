import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import { allowRequest, clientIp } from "@/auth/ip-rate-limit";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { guardLoginRequest, loginErrorResponse, ipTag, auditLogin } from "@/modules/auth/http";
import { LoginError } from "@/modules/auth/login-service";
import { AuthConfigError } from "@/modules/auth/config";
import { writeStructuredLog,logError } from "@/observability/logger";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/auth/ip-rate-limit",()=>({allowRequest:vi.fn(),clientIp:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/observability/logger",()=>({writeStructuredLog:vi.fn(),logError:vi.fn()}));
const origin=vi.mocked(isSameOriginRequest);
const allow=vi.mocked(allowRequest);
const ip=vi.mocked(clientIp);
const tenant=vi.mocked(resolveRequestTenant);

function req(body: string): Request {
  return new Request("https://campus.example.test/api/auth/start",{
    method:"POST",headers:{"host":"campus.example.test","content-type":"application/json"},
    body,
  });
}
const schema=z.object({code:z.string().length(6)});
async function rejected(result:Awaited<ReturnType<typeof guardLoginRequest<typeof schema>>>) {
  if (result.ok) throw new Error("Expected rejection");
  return {status:result.response.status,data:await result.response.json(),
    retry:result.response.headers.get("retry-after")};
}
describe("WEAK-auth HTTP: guard ordering, errors and no PII logs",()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    origin.mockReturnValue(true);
    allow.mockReturnValue(true);
    ip.mockReturnValue("198.51.100.12");
    tenant.mockResolvedValue({kind:"platform"} as never);
  });
  it("WEAK-auth-http-01 denies cross-origin before rate limit, JSON parse or tenant lookup",async()=>{
    origin.mockReturnValue(false);
    const response=await rejected(await guardLoginRequest(req('{"code":"123456"}'),schema,"otp",4));
    expect(response).toMatchObject({status:403,data:{error:"INVALID_ORIGIN"}});
    expect(allow).not.toHaveBeenCalled();
    expect(tenant).not.toHaveBeenCalled();
  });
  it("WEAK-auth-http-02 rate limit is keyed by route and client IP, before payload validation",async()=>{
    allow.mockReturnValue(false);
    const response=await rejected(await guardLoginRequest(req("malformed"),schema,"otp",4));
    expect(response).toMatchObject({status:429,data:{error:"TOO_MANY_REQUESTS",retryAfterSeconds:60},retry:"60"});
    expect(allow).toHaveBeenCalledWith("otp:198.51.100.12",4);
    expect(tenant).not.toHaveBeenCalled();
  });
  it.each(["not json",'{"code":"123"}','{"code":123456}'])(
    "WEAK-auth-http-03 never resolves tenancy or returns raw body for invalid JSON/input %s",async body=>{
      const response=await rejected(await guardLoginRequest(req(body),schema,"otp",4));
      expect(response.status).toBe(400);
      expect(response.data).toEqual({error:"INVALID_REQUEST"});
      expect(tenant).not.toHaveBeenCalled();
    });
  it("WEAK-auth-http-04 unknown tenant host returns 404 and no validated body",async()=>{
    tenant.mockResolvedValueOnce({kind:"unknown"} as never);
    const response=await rejected(await guardLoginRequest(req('{"code":"123456"}'),schema,"otp",4));
    expect(response).toMatchObject({status:404,data:{error:"UNKNOWN_TENANT_HOST"}});
  });
  it("WEAK-auth-http-05 successful college host exposes only validated body and college scope",async()=>{
    const college="11111111-1111-4111-8111-111111111111";
    tenant.mockResolvedValueOnce({kind:"college",collegeId:college} as never);
    const outcome=await guardLoginRequest(req('{"code":"123456","secret":"drop-this"}'),schema,"otp",4);
    expect(outcome).toEqual({ok:true,body:{code:"123456"},tenantCollegeId:college,ip:"198.51.100.12"});
  });
  it("WEAK-auth-http-06 auth errors expose safe code/retry only and hide exception text",async()=>{
    const limited=loginErrorResponse(new LoginError("TOO_MANY_REQUESTS",37));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("37");
    expect(await limited.json()).toEqual({error:"TOO_MANY_REQUESTS",
      message:"Too many OTP requests. Please try again later.",retryAfterSeconds:37});
    const config=loginErrorResponse(new AuthConfigError("private configuration detail"));
    expect(config.status).toBe(503);
    expect(await config.json()).toEqual({error:"AUTH_NOT_CONFIGURED"});
    const unexpected=loginErrorResponse(new Error("sensitive-login-token"));
    expect(unexpected.status).toBe(500);
    expect(await unexpected.json()).toEqual({error:"INTERNAL_ERROR"});
    expect(logError).toHaveBeenCalledTimes(2);
  });
  it("WEAK-auth-http-07 IP logs are one-way tags, caller fields and raw addresses stay out of structured output",()=>{
    expect(ipTag("198.51.100.12")).toMatch(/^[a-f0-9]{12}$/);
    expect(ipTag("198.51.100.12")).toBe(ipTag("198.51.100.12"));
    expect(ipTag("198.51.100.13")).not.toBe(ipTag("198.51.100.12"));
    auditLogin("auth.attempt",{route:"otp",ip:"198.51.100.12"},{accepted:false});
    expect(writeStructuredLog).toHaveBeenCalledOnce();
    const args=vi.mocked(writeStructuredLog).mock.calls[0];
    expect(JSON.stringify(args)).not.toContain("198.51.100.12");
    expect(JSON.stringify(args)).toContain("ipTag");
  });
});
