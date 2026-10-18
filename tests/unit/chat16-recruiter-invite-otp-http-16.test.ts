import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {requestRecruiterInviteOtp} from "@/modules/placements/recruiter-invite-otp-service";
import {deliverPublicRecruiterJoinCode} from "@/modules/messaging/public-join-code-delivery";
import {isRecruiterInviteTokenShape} from "@/modules/placements/tpo-recruiter-invite-policy";
import {acceptPublicTpoRecruiterInviteOtp}
 from "@/modules/placements/public-recruiter-invite-accept-service";
import {POST as sendCode}
 from "@/app/api/public/recruiter-invite/[token]/send-code/route";
import {POST as acceptCode}
 from "@/app/api/public/recruiter-invite/[token]/accept/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/recruiter-invite-otp-service",()=>({
 requestRecruiterInviteOtp:vi.fn(),
}));
vi.mock("@/modules/messaging/public-join-code-delivery",()=>({
 deliverPublicRecruiterJoinCode:vi.fn(),
}));
vi.mock("@/modules/placements/tpo-recruiter-invite-policy",()=>({
 isRecruiterInviteTokenShape:vi.fn(),
}));
vi.mock("@/modules/placements/public-recruiter-invite-accept-service",()=>({
 acceptPublicTpoRecruiterInviteOtp:vi.fn(),
}));

const token="safe-invite-token";
const original={
 db09:process.env.DB09_TPO_API_READY,
 otp:process.env.TPO_RECRUITER_OTP_READY,
 delivery:process.env.TPO_RECRUITER_OTP_DELIVERY_READY,
};
const ctx={params:Promise.resolve({token})};
const req=(path:"send-code"|"accept",body?:unknown)=>
 new Request("https://42lms.com/api/public/recruiter-invite/"+token+"/"+path,{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify(body??{}),
 });

beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(isRecruiterInviteTokenShape).mockReturnValue(true);
 process.env.DB09_TPO_API_READY="DB09_VERIFIED";
 process.env.TPO_RECRUITER_OTP_READY="VERIFIED";
 process.env.TPO_RECRUITER_OTP_DELIVERY_READY="VERIFIED";
});
afterEach(()=>{
 for(const [name,value] of [
  ["DB09_TPO_API_READY",original.db09],
  ["TPO_RECRUITER_OTP_READY",original.otp],
  ["TPO_RECRUITER_OTP_DELIVERY_READY",original.delivery],
 ] as const){
  if(value===undefined)delete process.env[name];
  else process.env[name]=value;
 }
});

describe("chat-16 public recruiter invitation code request and acceptance routes",()=>{
 it("REC-INVITE-HTTP-16 forbids cross-origin code and acceptance before any service call",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  expect((await sendCode(req("send-code"),ctx)).status).toBe(403);
  expect((await acceptCode(req("accept",{code:"123456"}),ctx)).status).toBe(403);
  expect(requestRecruiterInviteOtp).not.toHaveBeenCalled();
  expect(acceptPublicTpoRecruiterInviteOtp).not.toHaveBeenCalled();
 });
 it("REC-INVITE-HTTP-17 rejects malformed invitation tokens before attempting code delivery",async()=>{
  vi.mocked(isRecruiterInviteTokenShape).mockReturnValue(false);
  const response=await sendCode(req("send-code"),ctx);
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({error:"INVITE_INVALID"});
  expect(requestRecruiterInviteOtp).not.toHaveBeenCalled();
 });
 it("REC-INVITE-HTTP-18 does not advertise code delivery when storage or provider gates are unverified",async()=>{
  process.env.TPO_RECRUITER_OTP_DELIVERY_READY="DISABLED";
  const sent=await sendCode(req("send-code"),ctx);
  const accepted=await acceptCode(req("accept",{code:"123456"}),ctx);
  expect(sent.status).toBe(503);
  expect(accepted.status).toBe(503);
  expect(await sent.json()).toEqual({error:"RECRUITER_INVITE_NOT_READY"});
  expect(await accepted.json()).toEqual({error:"RECRUITER_INVITE_NOT_READY"});
  expect(requestRecruiterInviteOtp).not.toHaveBeenCalled();
  expect(acceptPublicTpoRecruiterInviteOtp).not.toHaveBeenCalled();
 });
 it("REC-INVITE-HTTP-19 sends codes only through a dedicated delivery adapter and confirms delivery acceptance",async()=>{
  const response=await sendCode(req("send-code"),ctx);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({sent:true});
  expect(requestRecruiterInviteOtp).toHaveBeenCalledExactlyOnceWith(
   token,deliverPublicRecruiterJoinCode,
  );
 });
 it("REC-INVITE-HTTP-20 treats used, expired, throttled and failed code requests indistinguishably",async()=>{
  vi.mocked(requestRecruiterInviteOtp).mockRejectedValue(new Error("private email and provider failure"));
  const response=await sendCode(req("send-code"),ctx);
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({error:"INVITE_INVALID"});
  expect(JSON.stringify(await (await sendCode(req("send-code"),ctx)).json()))
   .not.toContain("private email");
 });
 it("REC-INVITE-HTTP-21 refuses user-ID or email injection, malformed and blank verification codes",async()=>{
  for(const body of [
   {code:"123456",userId:"outside-user"},
   {code:"123456",email:"outside@example.org"},
   {code:"invalid"},{code:""},
  ]){
   const response=await acceptCode(req("accept",body),ctx);
   expect(response.status).toBe(404);
   expect(await response.json()).toEqual({error:"INVITE_INVALID"});
  }
  expect(acceptPublicTpoRecruiterInviteOtp).not.toHaveBeenCalled();
 });
 it("REC-INVITE-HTTP-22 returns only server-verified joined identity and no-store result",async()=>{
  const result={accepted:true,outcome:"JOINED" as const,signInEmail:"recruiter@example.org"};
  vi.mocked(acceptPublicTpoRecruiterInviteOtp).mockResolvedValue(result);
  const response=await acceptCode(req("accept",{code:"123456",name:"Recruiter"}),ctx);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual(result);
  expect(acceptPublicTpoRecruiterInviteOtp).toHaveBeenCalledExactlyOnceWith(
   token,"123456",{code:"123456",name:"Recruiter"},
  );
 });
});
