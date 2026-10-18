import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {acceptPublicTpoRecruiterInviteOtp} from "@/modules/placements/public-recruiter-invite-accept-service";
import {POST} from "@/app/api/public/recruiter-invite/[token]/accept/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/public-recruiter-invite-accept-service",()=>({
 acceptPublicTpoRecruiterInviteOtp:vi.fn(),
}));
const url="https://college.example.edu/api/public/recruiter-invite/accept";
const context={params:Promise.resolve({token:"verified-invite"})};
const req=(body:BodyInit)=>new Request(url,{
 method:"POST",headers:{"content-type":"application/json"},body,
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.stubEnv("DB09_TPO_API_READY","DB09_VERIFIED");
 vi.stubEnv("TPO_RECRUITER_OTP_READY","VERIFIED");
 vi.stubEnv("TPO_RECRUITER_OTP_DELIVERY_READY","VERIFIED");
 vi.mocked(acceptPublicTpoRecruiterInviteOtp).mockResolvedValue({
  accepted:true,outcome:"JOINED",signInEmail:"recruiter@example.org",
 });
});
afterEach(()=>vi.unstubAllEnvs());

describe("chat-16 recruiter invitation OTP acceptance body, availability and scope",()=>{
 it("PUBLIC-INVITE-SIZE-34 refuses 8KB+ UTF-8 before invoking identity/grant creation",async()=>{
  const res=await POST(req("é".repeat(5000)),context);
  expect(res.status).toBe(413);
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect(acceptPublicTpoRecruiterInviteOtp).not.toHaveBeenCalled();
 });
 it("PUBLIC-INVITE-SIZE-35 denies malformed/forged fields and failed origin before grant write",async()=>{
  for(const body of ["{invalid",JSON.stringify({code:"123456",userId:"another-user"})]){
   expect((await POST(req(body),context)).status).toBe(404);
  }
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  expect((await POST(req("x".repeat(10_000)),context)).status).toBe(403);
  expect(acceptPublicTpoRecruiterInviteOtp).not.toHaveBeenCalled();
 });
 it("PUBLIC-INVITE-SIZE-36 keeps deploy readiness first and a bounded success response",async()=>{
  vi.stubEnv("TPO_RECRUITER_OTP_DELIVERY_READY","");
  expect((await POST(req(JSON.stringify({code:"123456"})),context)).status).toBe(503);
  expect(acceptPublicTpoRecruiterInviteOtp).not.toHaveBeenCalled();
  vi.stubEnv("TPO_RECRUITER_OTP_DELIVERY_READY","VERIFIED");
  const response=await POST(req(JSON.stringify({code:"123456",name:"Recruiter"})),context);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
   accepted:true,outcome:"JOINED",signInEmail:"recruiter@example.org",
  });
  expect(acceptPublicTpoRecruiterInviteOtp).toHaveBeenCalledWith(
   "verified-invite","123456",{code:"123456",name:"Recruiter"},
  );
 });
});