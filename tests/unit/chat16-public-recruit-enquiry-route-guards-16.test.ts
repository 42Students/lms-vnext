import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {sendPublicEnquiryCode,PublicEnquiryError} from "@/modules/placements/public-enquiry/send-service";
import {submitPublicRecruitEnquiry} from "@/modules/placements/public-enquiry/recruit-service";
import {POST as sendCode} from "@/app/api/public/recruit-from-us/send-code/route";
import {POST as recruit} from "@/app/api/public/recruit-from-us/recruit/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/placements/public-enquiry/send-service",()=>({
 sendPublicEnquiryCode:vi.fn(),
 PublicEnquiryError:class PublicEnquiryError extends Error{
  constructor(readonly code:string){super("PUBLIC_ENQUIRY_"+code);}
 },
}));
vi.mock("@/modules/placements/public-enquiry/recruit-service",()=>({
 submitPublicRecruitEnquiry:vi.fn(),
}));
const collegeId="11111111-1111-4111-8111-111111111111";
const request=()=>new Request("https://college.example.edu/api/public/recruit-from-us/send-code",{
 method:"POST",
 headers:{"host":"college.example.edu","Content-Type":"application/json","x-public-verified-client-ip":"192.0.2.10"},
 body:JSON.stringify({email:"staff@example.org"}),
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(resolveRequestTenant).mockResolvedValue({
  kind:"college",host:"college.example.edu",collegeId,organizationId:"org-1",
 });
 vi.mocked(sendPublicEnquiryCode).mockResolvedValue({sent:true});
 vi.mocked(submitPublicRecruitEnquiry).mockResolvedValue({received:true});
});
afterEach(()=>vi.unstubAllEnvs());

describe("chat-16 anonymous recruiter enquiry HTTP outage and scope safety",()=>{
 it("PUBLIC-ENQUIRY-FAIL-16 denies cross-origin posts before looking up the host or email",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  for(const route of [sendCode,recruit]){
   const response=await route(request());
   expect(response.status).toBe(403);
  }
  expect(resolveRequestTenant).not.toHaveBeenCalled();
  expect(sendPublicEnquiryCode).not.toHaveBeenCalled();
  expect(submitPublicRecruitEnquiry).not.toHaveBeenCalled();
 });
 it("PUBLIC-ENQUIRY-FAIL-17 returns 404 for unverified tenant instead of contacting college services",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unknown",host:"college.example.edu"});
  for(const route of [sendCode,recruit]){
   const response=await route(request());
   expect(response.status).toBe(404);
  }
  expect(sendPublicEnquiryCode).not.toHaveBeenCalled();
  expect(submitPublicRecruitEnquiry).not.toHaveBeenCalled();
 });
 it("PUBLIC-ENQUIRY-FAIL-18 maps tenant registry outage to a no-store generic 503",async()=>{
  vi.mocked(resolveRequestTenant).mockRejectedValue(new Error("SECRET_TENANT_DB_DSN"));
  for(const route of [sendCode,recruit]){
   const response=await route(request());
   expect(response.status).toBe(503);
   expect(response.headers.get("cache-control")).toBe("no-store");
   expect(await response.text()).not.toContain("SECRET_TENANT_DB_DSN");
  }
  expect(sendPublicEnquiryCode).not.toHaveBeenCalled();
  expect(submitPublicRecruitEnquiry).not.toHaveBeenCalled();
 });
 it("PUBLIC-ENQUIRY-FAIL-19 does not leak a failed mail provider or database exception",async()=>{
  vi.mocked(sendPublicEnquiryCode).mockRejectedValue(new Error("SECRET_ZEPTOMAIL_TOKEN"));
  vi.mocked(submitPublicRecruitEnquiry).mockRejectedValue(new Error("SECRET_DB_CREDENTIAL"));
  for(const route of [sendCode,recruit]){
   const response=await route(request());
   expect(response.status).toBe(503);
   expect(response.headers.get("cache-control")).toBe("no-store");
   expect(await response.text()).not.toMatch(/SECRET_|ZEPTOMAIL_TOKEN|DB_CREDENTIAL/);
  }
 });
 it("PUBLIC-ENQUIRY-FAIL-20 preserves success and passes only verified proxy IPs",async()=>{
  vi.stubEnv("PUBLIC_JOIN_TRUSTED_PROXY_READY","");
  expect(await (await sendCode(request())).json()).toEqual({sent:true});
  expect(await (await recruit(request())).json()).toEqual({received:true});
  expect(sendPublicEnquiryCode).toHaveBeenCalledWith(collegeId,expect.any(Object),null);
  expect(submitPublicRecruitEnquiry).toHaveBeenCalledWith(collegeId,expect.any(Object),null);
  vi.stubEnv("PUBLIC_JOIN_TRUSTED_PROXY_READY","VERIFIED");
  await sendCode(request());
  expect(sendPublicEnquiryCode).toHaveBeenLastCalledWith(collegeId,expect.any(Object),"192.0.2.10");
 });
 it("PUBLIC-ENQUIRY-FAIL-21 keeps public rate-limit and readiness distinctions",async()=>{
  vi.mocked(sendPublicEnquiryCode).mockRejectedValue(new PublicEnquiryError("LIMIT"));
  const limited=await sendCode(request());
  expect(limited.status).toBe(429);
  expect(await limited.json()).toEqual({error:"TOO_MANY_TRIES"});
  vi.mocked(submitPublicRecruitEnquiry).mockRejectedValue(new PublicEnquiryError("NOT_READY"));
  const unavailable=await recruit(request());
  expect(unavailable.status).toBe(503);
  expect(await unavailable.json()).toEqual({error:"RECRUITER_ENQUIRIES_UNAVAILABLE"});
 });
 it("PUBLIC-ENQUIRY-SIZE-24 rejects oversize UTF-8 bytes at both public POST routes before services",async()=>{
  const oversized=new Request("https://college.example.edu/api/public/recruit-from-us",{
   method:"POST",headers:{host:"college.example.edu"},body:"é".repeat(5000),
  });
  const first=await sendCode(oversized);
  expect(first.status).toBe(413);
  expect(await first.json()).toEqual({error:"REQUEST_TOO_LARGE"});
  const second=await recruit(new Request("https://college.example.edu/api/public/recruit-from-us",{
   method:"POST",headers:{host:"college.example.edu"},body:"x".repeat(8193),
  }));
  expect(second.status).toBe(413);
  expect(second.headers.get("cache-control")).toBe("no-store");
  expect(sendPublicEnquiryCode).not.toHaveBeenCalled();
  expect(submitPublicRecruitEnquiry).not.toHaveBeenCalled();
 });
 it("PUBLIC-ENQUIRY-SIZE-25 rejects malformed JSON and UTF-8 without contacting a provider",async()=>{
  const broken=new Request("https://college.example.edu/api/public/recruit-from-us",{
   method:"POST",headers:{host:"college.example.edu"},body:"{invalid-json",
  });
  expect((await sendCode(broken)).status).toBe(400);
  const invalidUtf8=new Request("https://college.example.edu/api/public/recruit-from-us",{
   method:"POST",headers:{host:"college.example.edu"},body:new Blob([Uint8Array.of(0xff,0xfe)]),
  });
  expect((await recruit(invalidUtf8)).status).toBe(400);
  expect(sendPublicEnquiryCode).not.toHaveBeenCalled();
  expect(submitPublicRecruitEnquiry).not.toHaveBeenCalled();
 });
});
