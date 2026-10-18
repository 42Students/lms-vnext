import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {requestPublicJoinCode,PublicJoinCodeError}
 from "@/modules/placements/public-join/send-code-service";
import {acceptPublicRecruiterJoin,PublicJoinAcceptError}
 from "@/modules/placements/public-join/join-service";
import {deliverPublicRecruiterJoinCode}
 from "@/modules/messaging/public-join-code-delivery";
import {POST as companySendCode} from "@/app/api/public/company-join/send-code/route";
import {POST as collegeSendCode} from "@/app/api/public/college-join/send-code/route";
import {POST as companyJoin} from "@/app/api/public/company-join/join/route";
import {POST as collegeJoin} from "@/app/api/public/college-join/join/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/public-join/send-code-service",()=>({
 PublicJoinCodeError:class PublicJoinCodeError extends Error{
  constructor(readonly code:string){super("PUBLIC_JOIN_"+code);}
 },
 requestPublicJoinCode:vi.fn(),
}));
vi.mock("@/modules/placements/public-join/join-service",()=>({
 PublicJoinAcceptError:class PublicJoinAcceptError extends Error{
  constructor(readonly code:string){super("PUBLIC_JOIN_"+code);}
 },
 acceptPublicRecruiterJoin:vi.fn(),
}));
vi.mock("@/modules/messaging/public-join-code-delivery",()=>({
 deliverPublicRecruiterJoinCode:vi.fn(),
}));

const original=process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY;
const body={token:"a".repeat(64),email:"recruiter@example.org",code:"123456"};
const req=(scope:"company"|"college",action:"send-code"|"join")=>
 new Request("https://42lms.com/api/public/"+scope+"-join/"+action,{
  method:"POST",headers:{"Content-Type":"application/json",
   "x-public-verified-client-ip":"198.51.100.21"},body:JSON.stringify(body),
 });
const scopeRoutes=[
 {scope:"COMPANY" as const,path:"company" as const,send:companySendCode,join:companyJoin},
 {scope:"COLLEGE" as const,path:"college" as const,send:collegeSendCode,join:collegeJoin},
];
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 delete process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY;
});
afterEach(()=>{
 if(original===undefined)delete process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY;
 else process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY=original;
});

describe("chat-16 public recruiter company and college OTP HTTP security",()=>{
 it.each(scopeRoutes)("REC-JOIN-HTTP-16 $scope denies cross-origin code and join before reading input",async route=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const send=await route.send(req(route.path,"send-code"));
  const joined=await route.join(req(route.path,"join"));
  expect(send.status).toBe(403);
  expect(joined.status).toBe(403);
  expect(requestPublicJoinCode).not.toHaveBeenCalled();
  expect(acceptPublicRecruiterJoin).not.toHaveBeenCalled();
 });
 it.each(scopeRoutes)("REC-JOIN-HTTP-17 $scope never trusts a claimed proxy header while deployment attestation is absent",async route=>{
  vi.mocked(requestPublicJoinCode).mockResolvedValue({sent:true,companyName:null});
  vi.mocked(acceptPublicRecruiterJoin).mockResolvedValue({
   joined:true,outcome:"JOINED",signInEmail:"recruiter@example.org",
  });
  await route.send(req(route.path,"send-code"));
  await route.join(req(route.path,"join"));
  expect(requestPublicJoinCode).toHaveBeenCalledWith(route.scope,body,null,deliverPublicRecruiterJoinCode);
  expect(acceptPublicRecruiterJoin).toHaveBeenCalledWith(route.scope,body,null);
 });
 it.each(scopeRoutes)("REC-JOIN-HTTP-18 $scope forwards only attested network identity to rate-limited services",async route=>{
  process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY="VERIFIED";
  vi.mocked(requestPublicJoinCode).mockResolvedValue({sent:true,companyName:"Example Inc"});
  vi.mocked(acceptPublicRecruiterJoin).mockResolvedValue({
   joined:true,outcome:"ALREADY_JOINED",signInEmail:"recruiter@example.org",
  });
  const sent=await route.send(req(route.path,"send-code"));
  const joined=await route.join(req(route.path,"join"));
  expect(sent.status).toBe(200);
  expect(joined.status).toBe(200);
  expect(sent.headers.get("Cache-Control")).toBe("no-store");
  expect(joined.headers.get("Cache-Control")).toBe("no-store");
  expect(await sent.json()).toEqual({sent:true,companyName:"Example Inc"});
  expect(await joined.json()).toEqual({
   joined:true,outcome:"ALREADY_JOINED",signInEmail:"recruiter@example.org",
  });
  expect(requestPublicJoinCode).toHaveBeenCalledWith(
   route.scope,body,"198.51.100.21",deliverPublicRecruiterJoinCode,
  );
  expect(acceptPublicRecruiterJoin).toHaveBeenCalledWith(
   route.scope,body,"198.51.100.21",
  );
 });
 it.each(scopeRoutes)("REC-JOIN-HTTP-19 $scope rejects missing network guard without falsely confirming OTP delivery",async route=>{
  vi.mocked(requestPublicJoinCode).mockRejectedValue(new PublicJoinCodeError("NETWORK_GUARD_NOT_READY"));
  const response=await route.send(req(route.path,"send-code"));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({error:"SERVICE_NOT_READY"});
 });
 it.each(scopeRoutes)("REC-JOIN-HTTP-20 $scope maps throttled code and join attempts to 429",async route=>{
  vi.mocked(requestPublicJoinCode).mockRejectedValue(new PublicJoinCodeError("RATE_LIMITED"));
  vi.mocked(acceptPublicRecruiterJoin).mockRejectedValue(new PublicJoinAcceptError("RATE_LIMITED"));
  expect((await route.send(req(route.path,"send-code"))).status).toBe(429);
  expect((await route.join(req(route.path,"join"))).status).toBe(429);
 });
 it.each(scopeRoutes)("REC-JOIN-HTTP-21 $scope rejects missing MX without disclosing internal provider data",async route=>{
  vi.mocked(requestPublicJoinCode).mockRejectedValue(new PublicJoinCodeError("EMAIL_NO_MX"));
  const response=await route.send(req(route.path,"send-code"));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({error:"EMAIL_NO_MX"});
  const repeated=await route.send(req(route.path,"send-code"));
  expect(await repeated.json()).toEqual({error:"EMAIL_NO_MX"});
  expect(repeated.headers.get("Cache-Control")).toBe("no-store");
 });
 it.each(scopeRoutes)("REC-JOIN-HTTP-22 $scope preserves explicit persisted join rejection",async route=>{
  vi.mocked(acceptPublicRecruiterJoin).mockRejectedValue(new PublicJoinAcceptError("PHONE_STORAGE_NOT_READY"));
  const response=await route.join(req(route.path,"join"));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({error:"PHONE_STORAGE_NOT_READY"});
 });
});
