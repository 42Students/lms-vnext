import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as start} from "@/app/api/auth/account-proof/start/route";
import {POST as verify} from "@/app/api/auth/account-proof/verify/route";

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
vi.mock("@/modules/identity/own-account-proof-runtime",()=>({
 issueOwnAccountProofWithProvider:(...args:unknown[])=>mocks.issue(...args),
}));
vi.mock("@/modules/identity/scoped-account-verification-service",()=>({
 redeemScopedAccountProof:(...args:unknown[])=>mocks.redeem(...args),
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"SESSION_INVALID"},{status:401}),
}));
const id="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
const challengeId="33333333-3333-4333-8333-333333333333";
const makeContext=()=>({
 user:{id,platformStatus:"ACTIVE" as const,identityUid:"own-proof-test",systemRoles:[]},
 membership:{id:membershipId,collegeId:"college-one",organizationId:"org-one",
  status:"ACTIVE" as const,roles:["LEARNER" as const]},
});
function request(path:"start"|"verify",body:unknown,
 origin="https://college.test"){
 return new Request("https://college.test/api/auth/account-proof/"+path,{
  method:"POST",headers:{"Content-Type":"application/json",
   "host":"college.test","origin":origin},
  body:JSON.stringify(body),
 });
}
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.context.mockResolvedValue(makeContext());
 mocks.device.mockResolvedValue({userId:id,sessionId:"current-device"});
 mocks.issue.mockResolvedValue({challengeId,expiresAt:"2026-10-29T00:00:00.000Z"});
 mocks.redeem.mockResolvedValue(true);
});
describe("DB-004 signed-in role proof HTTP workflows",()=>{
 it("denies cross-origin before loading a session or sending any code",async()=>{
  for(const path of ["start","verify"] as const){
   const response=await (path==="start"?start:verify)(
    request(path,{}, "https://attacker.example"));
   expect(response.status).toBe(403);
   expect((await response.json()).error).toBe("INVALID_ORIGIN");
   expect(response.headers.get("cache-control")).toBe("private, no-store");
  }
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.issue).not.toHaveBeenCalled();
  expect(mocks.redeem).not.toHaveBeenCalled();
 });
 it("derives the role and UUIDs server-side and returns no code or session",async()=>{
  const response=await start(request("start",{channel:"EMAIL",expectedRollNumber:"ABC-22"}));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({challengeId,
   expiresAt:"2026-10-29T00:00:00.000Z",kind:"SCOPED_ACCOUNT_PROOF",
   sessionCreated:false});
  expect(mocks.issue).toHaveBeenCalledWith({
   userId:id,membershipId,role:"LEARNER",channel:"EMAIL",expectedRollNumber:"ABC-22",
  });
 });
 it("rejects client-controlled user, college, membership or role fields",async()=>{
  for(const body of [
   {channel:"EMAIL",userId:"attacker"},
   {channel:"PHONE",membershipId:"other"},
   {channel:"PHONE",role:"FACULTY"},
   {channel:"EMAIL",collegeId:"foreign"},
  ]){
   const response=await start(request("start",body));
   expect(response.status).toBe(400);
  }
  expect(mocks.issue).not.toHaveBeenCalled();
 });
 it("does not issue a proof for another device, stale identity or unselected role",async()=>{
  mocks.device.mockResolvedValueOnce({userId:"foreign"});
  expect((await start(request("start",{channel:"EMAIL"}))).status).toBe(403);
  mocks.context.mockResolvedValueOnce({...makeContext(),membership:null});
  expect((await start(request("start",{channel:"EMAIL"}))).status).toBe(403);
  mocks.context.mockResolvedValueOnce({...makeContext(),
    membership:{...makeContext().membership,roles:["TPO"]}});
  expect((await start(request("start",{channel:"EMAIL"}))).status).toBe(403);
  expect(mocks.issue).not.toHaveBeenCalled();
 });
 it("fails closed when the live session is missing or delivery is unavailable",async()=>{
  mocks.device.mockRejectedValueOnce(new Error("SESSION_MISSING"));
  expect((await start(request("start",{channel:"PHONE"}))).status).toBe(401);
  mocks.issue.mockRejectedValueOnce(new Error("ROLE_PROOF_DELIVERY_DISABLED"));
  const response=await start(request("start",{channel:"PHONE"}));
  expect(response.status).toBe(503);
  expect((await response.json()).error).toBe("PROOF_DELIVERY_UNAVAILABLE");
 });
 it("enforces a bounded input and rate-limits repeated issuance",async()=>{
  const large=await start(request("start",{channel:"EMAIL",x:"x".repeat(3000)}));
  expect(large.status).toBe(413);
  mocks.issue.mockRejectedValueOnce(new Error("ROLE_PROOF_RATE_LIMIT"));
  const response=await start(request("start",{channel:"EMAIL"}));
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("60");
 });
 it("redeems only against signed-in own membership and returns no login token",async()=>{
  const response=await verify(request("verify",{challengeId,code:"123456"}));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
   verified:true,kind:"SCOPED_ACCOUNT_PROOF",sessionCreated:false,
  });
  expect(mocks.redeem).toHaveBeenCalledWith({
   challengeId,code:"123456",userId:id,membershipId,role:"LEARNER",
  });
 });
 it("does not redeem foreign identifiers, malformed OTPs, or exhausted proof",async()=>{
  for(const body of [
   {challengeId,code:"abc123"},
   {challengeId,code:"123456",userId:"attacker"},
   {challengeId:"bad",code:"123456"},
   {challengeId,code:"123456",role:"FACULTY"},
  ]){
   const response=await verify(request("verify",body));
   expect(response.status).toBe(400);
  }
  expect(mocks.redeem).not.toHaveBeenCalled();
  mocks.redeem.mockResolvedValueOnce(false);
  const expired=await verify(request("verify",{challengeId,code:"123456"}));
  expect(await expired.json()).toMatchObject({verified:false,sessionCreated:false});
 });
});
