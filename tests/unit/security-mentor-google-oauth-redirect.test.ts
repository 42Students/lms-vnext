import {beforeEach,describe,expect,it,vi} from "vitest";
import {createHash} from "node:crypto";

const mock=vi.hoisted(()=>({
 context:vi.fn(),status:vi.fn(),config:vi.fn(),consent:vi.fn(),
 exchange:vi.fn(),save:vi.fn(),cookie:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/projects/mentor-google-calendar-connection-service",()=>({
 mentorGoogleConnectionState:mock.status,
 saveMentorGoogleConnection:mock.save,
}));
vi.mock("@/modules/projects/mentor-google-calendar-provider",()=>({
 mentorGoogleConfig:mock.config,
 mentorGoogleConsentUrl:mock.consent,
 mentorGoogleExchangeCode:mock.exchange,
 mentorGooglePkceChallenge:(verifier:string)=>createHash("sha256").update(verifier,"ascii").digest("base64url"),
}));
vi.mock("next/headers",()=>({cookies:async()=>({get:mock.cookie})}));

import {GET as connect} from "@/app/api/mentor/calendar/google/connect/route";
import {GET as callback} from "@/app/api/mentor/calendar/google/callback/route";

const actor={user:{id:"11111111-1111-4111-8111-111111111111"},
 membership:{id:"22222222-2222-4222-8222-222222222222"}};
const url="https://lms.example/api/mentor/calendar/google/callback";
const state="a".repeat(43);
const verifier="v".repeat(43);

function assertSecretSafeRedirect(response:Response){
 expect(response.status).toBe(307);
 expect(response.headers.get("cache-control")).toContain("no-store");
 expect(response.headers.get("cache-control")).toContain("private");
 expect(response.headers.get("referrer-policy")).toBe("no-referrer");
 expect(response.headers.get("x-robots-tag")).toContain("noindex");
 expect(response.headers.get("pragma")).toBe("no-cache");
}
function callbackRequest(query:string){
 return new Request(url+(query?"?"+query:""));
}

describe("Mentor Calendar OAuth authorization-code URL confidentiality",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(actor);
  mock.status.mockResolvedValue({available:true,connected:false});
  mock.config.mockReturnValue({clientId:"test-id",clientSecret:"test-secret",redirectUri:url});
  mock.consent.mockImplementation((_config:unknown,nonce:string,challenge:string)=>
   "https://accounts.google.com/o/oauth2/v2/auth?state="+nonce+"&code_challenge="+challenge);
  mock.cookie.mockReturnValue({value:state+"."+actor.user.id+"."+actor.membership.id+"."+verifier});
  mock.exchange.mockResolvedValue({accessToken:"access-token",refreshToken:"encrypted-at-rest-later",expiresIn:3600});
  mock.save.mockResolvedValue(undefined);
 });
 it("sets a short-lived HttpOnly nonce and non-referring headers on an authorized connect",async()=>{
  const response=await connect(new Request("https://lms.example/api/mentor/calendar/google/connect"));
  assertSecretSafeRedirect(response);
  expect(response.headers.get("location")).toContain("https://accounts.google.com/");
  const nonce=mock.consent.mock.calls[0]?.[1] as string;
  expect(nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const oauthCookie=response.cookies.get("mentor-google-oauth");
  const challenge=mock.consent.mock.calls[0]?.[2] as string;
  expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const pieces=oauthCookie?.value.split(".");
  expect(pieces).toHaveLength(4);
  expect(pieces?.slice(0,3).join(".")).toBe(nonce+"."+actor.user.id+"."+actor.membership.id);
  expect(pieces?.[3]).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(challenge).toBe(createHash("sha256").update(pieces?.[3]??"","ascii")
   .digest("base64url"));
  expect(oauthCookie?.httpOnly).toBe(true);
  expect(oauthCookie?.path).toBe("/api/mentor/calendar/google");
  expect(oauthCookie?.maxAge).toBe(600);
 });
 it("protects unavailable and thrown connect paths without issuing a nonce",async()=>{
  mock.status.mockResolvedValueOnce({available:false});
  const unavailable=await connect(new Request("https://lms.example/api/mentor/calendar/google/connect"));
  assertSecretSafeRedirect(unavailable);
  expect(unavailable.headers.get("location")).toBe("https://lms.example/mentor/calendar?google=unavailable");
  expect(mock.consent).not.toHaveBeenCalled();
  mock.context.mockRejectedValueOnce(new Error("private tenant identifier"));
  const failure=await connect(new Request("https://lms.example/api/mentor/calendar/google/connect"));
  assertSecretSafeRedirect(failure);
  expect(failure.headers.get("location")).not.toContain("private");
 });
 it("never forwards a wrong or duplicated OAuth state to the token service",async()=>{
  for(const query of [
   "state="+state.slice(1)+"b&code=valid-auth-code",
   "state="+state+"&state="+state+"&code=valid-auth-code",
   "state="+state+"&code=valid-auth-code&code=other-auth-code",
   "state="+state+"&code=",
  ]){
   const response=await callback(callbackRequest(query));
   assertSecretSafeRedirect(response);
   expect(response.headers.get("location")).toBe("https://lms.example/mentor/calendar?google=failed");
   expect(response.cookies.get("mentor-google-oauth")?.maxAge).toBe(0);
  }
  expect(mock.exchange).not.toHaveBeenCalled();
  expect(mock.save).not.toHaveBeenCalled();
 });
 it("on success consumes the credential without reflecting the code or state in a redirect",async()=>{
  const response=await callback(callbackRequest("state="+state+"&code=valid-auth-code"));
  assertSecretSafeRedirect(response);
  expect(response.headers.get("location")).toBe("https://lms.example/mentor/calendar?google=connected");
  expect(response.headers.get("location")).not.toContain(state);
  expect(response.headers.get("location")).not.toContain("valid-auth-code");
  expect(response.cookies.get("mentor-google-oauth")?.maxAge).toBe(0);
  expect(mock.exchange).toHaveBeenCalledTimes(1);
  expect(mock.exchange).toHaveBeenCalledWith(expect.any(Object),"valid-auth-code",verifier);
  expect(mock.save).toHaveBeenCalledWith(actor,"encrypted-at-rest-later");
 });
 it("rejects legacy nonce-only cookies and malformed PKCE verifiers",async()=>{
  for(const value of [
   state+"."+actor.user.id+"."+actor.membership.id,
   state+"."+actor.user.id+"."+actor.membership.id+".short",
   state+"."+actor.user.id+"."+actor.membership.id+"."+"=".repeat(43),
  ]){
   mock.cookie.mockReturnValueOnce({value});
   const response=await callback(callbackRequest("state="+state+"&code=valid-auth-code"));
   assertSecretSafeRedirect(response);
   expect(response.headers.get("location")).toContain("google=failed");
  }
  expect(mock.exchange).not.toHaveBeenCalled();
  expect(mock.save).not.toHaveBeenCalled();
 });
 it("fails closed when the provider omits a refresh token",async()=>{
  mock.exchange.mockResolvedValueOnce({accessToken:"access-token",refreshToken:null,expiresIn:3600});
  const response=await callback(callbackRequest("state="+state+"&code=valid-auth-code"));
  assertSecretSafeRedirect(response);
  expect(response.headers.get("location")).toContain("google=failed");
  expect(mock.save).not.toHaveBeenCalled();
 });
 it("on a provider exception neither exposes the error nor reuses the OAuth cookie",async()=>{
  mock.exchange.mockRejectedValueOnce(new Error("provider credential diagnostic"));
  const response=await callback(callbackRequest("state="+state+"&code=valid-auth-code"));
  assertSecretSafeRedirect(response);
  expect(response.headers.get("location")).toBe("https://lms.example/mentor/calendar?google=failed");
  expect(response.headers.get("location")).not.toContain("credential");
  expect(response.cookies.get("mentor-google-oauth")?.maxAge).toBe(0);
  expect(mock.save).not.toHaveBeenCalled();
 });
});
