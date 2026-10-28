import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as start} from "@/app/api/auth/email-ownership/start/route";
import {POST as redeem} from "@/app/api/auth/email-ownership/redeem/route";
import {ownEmailOwnershipScope} from "@/modules/identity/own-email-ownership-scope";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),device:vi.fn(),issue:vi.fn(),redeem:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:()=>mocks.context(),
}));
vi.mock("@/auth/current-session",()=>({
 getCurrentDeviceSession:()=>mocks.device(),
}));
vi.mock("@/modules/identity/own-email-ownership-runtime",()=>({
 issueOwnEmailOwnershipLink:(...args:unknown[])=>mocks.issue(...args),
 redeemOwnEmailOwnershipLink:(...args:unknown[])=>mocks.redeem(...args),
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"SESSION_INVALID"},{status:401}),
}));

const userId="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const applicationId="44444444-4444-4444-8444-444444444444";
const token="a".repeat(43);
const context=()=>({
 user:{id:userId,identityUid:"user",platformStatus:"ACTIVE" as const,systemRoles:[]},
 membership:{id:membershipId,collegeId,organizationId:"org",
  status:"ACTIVE" as const,roles:["LEARNER" as const]},
});
function request(method:"start"|"redeem",body:unknown,origin="https://college.test"){
 return new Request("https://college.test/api/auth/email-ownership/"+method,{
  method:"POST",headers:{host:"college.test",origin,
   "Content-Type":"application/json"},
  body:JSON.stringify(body),
 });
}
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.context.mockResolvedValue(context());
 mocks.device.mockResolvedValue({userId,sessionId:"device"});
 mocks.issue.mockResolvedValue({id:"link-id",expiresAt:"2026-10-29T00:00:00.000Z"});
 mocks.redeem.mockResolvedValue(true);
});
describe("DB004 application-bound email-link endpoints",()=>{
 it("denies CSRF before any session or provider interaction",async()=>{
  for(const action of ["start","redeem"] as const){
   const response=await(action==="start"?start:redeem)(
    request(action,{}, "https://attacker.test"));
   expect(response.status).toBe(403);
   expect((await response.json()).error).toBe("INVALID_ORIGIN");
   expect(response.headers.get("cache-control")).toBe("private, no-store");
  }
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.issue).not.toHaveBeenCalled();
  expect(mocks.redeem).not.toHaveBeenCalled();
 });
 it("server controls all link targets and does not return the bearer",async()=>{
  const response=await start(request("start",{applicationId}));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
   challengeId:"link-id",expiresAt:"2026-10-29T00:00:00.000Z",
   kind:"EMAIL_OWNERSHIP_LINK",sessionCreated:false,
  });
  expect(mocks.issue).toHaveBeenCalledWith({
   userId,collegeId,membershipId,applicationId,
  },"https://college.test");
 });
 it("rejects request-controlled target, recipient, redirect and provider template",async()=>{
  for(const extra of [
   {userId}, {membershipId}, {collegeId},
   {toEmail:"attacker.test@example.com"}, {redirectUrl:"https://attacker.test"},
   {templateName:"OTP"},{applicationId:"not-a-uuid"},
  ]){
   const response=await start(request("start",extra));
   expect(response.status).toBe(400);
  }
  expect(mocks.issue).not.toHaveBeenCalled();
 });
 it("rejects another device and any inactive or absent college membership",async()=>{
  mocks.device.mockResolvedValueOnce({userId:"other"});
  expect((await start(request("start",{}))).status).toBe(403);
  mocks.context.mockResolvedValueOnce({...context(),membership:null});
  expect((await start(request("start",{}))).status).toBe(403);
  mocks.context.mockResolvedValueOnce({...context(),
   membership:{...context().membership,status:"SUSPENDED"}});
  expect((await start(request("start",{}))).status).toBe(403);
  expect(mocks.issue).not.toHaveBeenCalled();
 });
 it("disallows non-learner scoped application proof",()=>{
  const faculty={...context(),membership:{
   ...context().membership,roles:["FACULTY" as const],
  }};
  expect(()=>ownEmailOwnershipScope(faculty,{userId},applicationId))
   .toThrow("EMAIL_LINK_CONTEXT_DENIED");
  expect(ownEmailOwnershipScope(faculty,{userId})).toEqual({
   userId,collegeId,membershipId,
  });
 });
 it("returns safe errors for no session, delivery failure and rate limits",async()=>{
  mocks.device.mockRejectedValueOnce(new Error("SESSION_MISSING"));
  expect((await start(request("start",{}))).status).toBe(401);
  mocks.issue.mockRejectedValueOnce(new Error("EMAIL_LINK_DELIVERY_FAILED"));
  const denied=await start(request("start",{}));
  expect(denied.status).toBe(503);
  expect((await denied.json()).error).toBe("PROOF_DELIVERY_UNAVAILABLE");
  mocks.issue.mockRejectedValueOnce(new Error("EMAIL_LINK_RATE_LIMIT"));
  const capped=await start(request("start",{}));
  expect(capped.status).toBe(429);
 });
 it("requires a real own session before consuming and never mints a session",async()=>{
  const response=await redeem(request("redeem",{token}));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
   verified:true,kind:"EMAIL_OWNERSHIP_LINK",sessionCreated:false,
  });
  expect(mocks.redeem).toHaveBeenCalledWith(token,{userId,collegeId,membershipId});
 });
 it("never accepts malformed, forged, oversized or expired redeems",async()=>{
  for(const body of [{token:"foo"}, {token,userId:"another"},
    {token,applicationId}, {token:9}]){
   expect((await redeem(request("redeem",body))).status).toBe(400);
  }
  expect(mocks.redeem).not.toHaveBeenCalled();
  mocks.redeem.mockResolvedValueOnce(false);
  const expired=await redeem(request("redeem",{token}));
  expect((await expired.json()).verified).toBe(false);
 });
});
