import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {
 previewRecruiterInvite,markRecruiterInviteNotHiring,unsubscribeRecruiterInvite,
 recordRecruiterInviteFirstOpen,
} from "@/modules/placements/tpo-recruiter-invite-service";
import {requestRecruiterInviteOtp} from "@/modules/placements/recruiter-invite-otp-service";
import {GET as preview} from "@/app/api/public/recruiter-invite/[token]/route";
import {POST as opened} from "@/app/api/public/recruiter-invite/[token]/opened/route";
import {POST as notHiring} from "@/app/api/public/recruiter-invite/[token]/not-hiring/route";
import {POST as unsubscribe} from "@/app/api/public/recruiter-invite/[token]/unsubscribe/route";
import {POST as sendCode} from "@/app/api/public/recruiter-invite/[token]/send-code/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/tpo-recruiter-invite-service",()=>({
 previewRecruiterInvite:vi.fn(),
 markRecruiterInviteNotHiring:vi.fn(),
 unsubscribeRecruiterInvite:vi.fn(),
 recordRecruiterInviteFirstOpen:vi.fn(),
}));
vi.mock("@/modules/placements/recruiter-invite-otp-service",()=>({
 requestRecruiterInviteOtp:vi.fn(),
}));
const token="a".repeat(43);
const params={params:Promise.resolve({token})};
const req=()=>new Request("https://college.example.edu/api/public/recruiter-invite/"+token,{
 method:"POST",headers:{"content-type":"application/json"},body:"{}",
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.stubEnv("DB09_TPO_API_READY","DB09_VERIFIED");
 vi.stubEnv("TPO_RECRUITER_OTP_READY","VERIFIED");
 vi.stubEnv("TPO_RECRUITER_OTP_DELIVERY_READY","VERIFIED");
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(previewRecruiterInvite).mockResolvedValue({
  collegeName:"Example College",companyName:"Example Co",contactName:"Recruiter",
  contactEmail:"recruiter@example.org",designation:null,
  expiresAt:new Date("2099-01-01T00:00:00.000Z"),
 });
 vi.mocked(recordRecruiterInviteFirstOpen).mockResolvedValue({recorded:false});
 vi.mocked(markRecruiterInviteNotHiring).mockResolvedValue({status:"NOT_HIRING"});
 vi.mocked(unsubscribeRecruiterInvite).mockResolvedValue({status:"UNSUBSCRIBED"});
});
afterEach(()=>vi.unstubAllEnvs());

describe("chat-16 public recruiter invitation preview and explicit lifecycle actions",()=>{
 it("PUBLIC-INVITE-ROUTE-37 keeps GET read-only; only POST may record a first open",async()=>{
  const response=await preview(new Request("https://college.example.edu/recruiter-invite/"+token),params);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({invite:{collegeName:"Example College"}});
  expect(previewRecruiterInvite).toHaveBeenCalledWith(token);
  expect(recordRecruiterInviteFirstOpen).not.toHaveBeenCalled();
  expect(markRecruiterInviteNotHiring).not.toHaveBeenCalled();
  expect(unsubscribeRecruiterInvite).not.toHaveBeenCalled();
 });
 it("PUBLIC-INVITE-ROUTE-38 denies every mutation on an untrusted cross-origin POST",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  for(const route of [opened,notHiring,unsubscribe,sendCode]){
   const response=await route(req(),params);
   expect(response.status).toBe(403);
  }
  for(const service of [
   recordRecruiterInviteFirstOpen,markRecruiterInviteNotHiring,
   unsubscribeRecruiterInvite,requestRecruiterInviteOtp,
  ])expect(service).not.toHaveBeenCalled();
 });
 it("PUBLIC-INVITE-ROUTE-39 keeps state mutations separate and preserves one-time open idempotency",async()=>{
  expect(await (await opened(req(),params)).json()).toEqual({recorded:false});
  expect(await (await notHiring(req(),params)).json()).toEqual({status:"NOT_HIRING"});
  expect(await (await unsubscribe(req(),params)).json()).toEqual({status:"UNSUBSCRIBED"});
  expect(recordRecruiterInviteFirstOpen).toHaveBeenCalledWith(token);
  expect(markRecruiterInviteNotHiring).toHaveBeenCalledWith(token);
  expect(unsubscribeRecruiterInvite).toHaveBeenCalledWith(token);
 });
 it("PUBLIC-INVITE-ROUTE-40 denies disabled deployment before any public read or mutation",async()=>{
  vi.stubEnv("DB09_TPO_API_READY","");
  expect((await preview(new Request("https://college.example.edu/recruiter-invite/"+token),params)).status).toBe(503);
  for(const route of [opened,notHiring,unsubscribe,sendCode]){
   expect((await route(req(),params)).status).toBe(503);
  }
  expect(previewRecruiterInvite).not.toHaveBeenCalled();
  expect(recordRecruiterInviteFirstOpen).not.toHaveBeenCalled();
  expect(markRecruiterInviteNotHiring).not.toHaveBeenCalled();
  expect(unsubscribeRecruiterInvite).not.toHaveBeenCalled();
  expect(requestRecruiterInviteOtp).not.toHaveBeenCalled();
 });
 it("PUBLIC-INVITE-ROUTE-41 non-enumerates malformed OTP invitation links before send",async()=>{
  const bad={params:Promise.resolve({token:"../invalid"})};
  expect((await sendCode(req(),bad)).status).toBe(404);
  expect(requestRecruiterInviteOtp).not.toHaveBeenCalled();
 });
});