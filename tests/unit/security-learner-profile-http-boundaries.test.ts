import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const m=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),hasRole:vi.fn(),load:vi.fn(),save:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.context}));
vi.mock("@/modules/identity/context",()=>({hasMembershipRole:m.hasRole}));
vi.mock("@/modules/people/runtime",()=>({getOwnLearnerProfileWithRuntime:m.load}));
vi.mock("@/modules/people/learner-profile-document-edit-service",()=>({
 updateOwnLearnerProfileDocument:m.save,
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>NextResponse.json({error:"AUTHENTICATION_REQUIRED"},
  {status:401,headers:{"Cache-Control":"private, no-store"}}),
}));
import {GET,PUT,OPTIONS} from "@/app/api/profile/me/route";
const origin="https://college.example.test";
const context={user:{id:"11111111-1111-4111-8111-111111111111"}};
const req=(path="/api/profile/me")=>new Request(origin+path);
const put=(body:string)=>new Request(origin+"/api/profile/me",{
 method:"PUT",headers:{origin,host:"college.example.test",
  "content-type":"application/json"},body,
});
beforeEach(()=>{
 vi.clearAllMocks();
 m.origin.mockReturnValue(true);
 m.context.mockResolvedValue(context);
 m.hasRole.mockReturnValue(true);
 m.load.mockResolvedValue({profile:{education:[],visibility:"PRIVATE"}});
 m.save.mockResolvedValue({membershipId:"a",profileDocument:{}});
});
describe("learner private profile endpoint",()=>{
 it("returns the private current profile only with no-store",async()=>{
  const res=await GET(req());
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(m.load).toHaveBeenCalledWith(context);
  expect((await res.json()).profile.visibility).toBe("PRIVATE");
 });
 it.each([
  "?legacySection=education&legacySection=skills",
  "?legacySection=",
  "?legacySection=%20",
 ])("rejects ambiguous or empty legacy profile selector %s before fetching",async suffix=>{
  const res=await GET(req("/api/profile/me"+suffix));
  expect(res.status).toBe(400);
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(m.load).not.toHaveBeenCalled();
 });
 it("allows only a Learner workspace to resolve a legacy section link",async()=>{
  m.hasRole.mockReturnValue(false);
  const res=await GET(req("/api/profile/me?legacySection=education"));
  expect(res.status).toBe(403);
  expect(m.load).not.toHaveBeenCalled();
 });
 it("retains private, no-referrer, same-origin legacy section redirects",async()=>{
  const res=await GET(req("/api/profile/me?legacySection=education"));
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe(origin+"/learn/profile?section=education");
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  expect(m.load).not.toHaveBeenCalled();
 });
 it("rejects oversize private profile JSON regardless of Content-Length",async()=>{
  const request=put(JSON.stringify({document:{},
   filler:"x".repeat(2*1024*1024)}));
  request.headers.set("content-length","1");
  const res=await PUT(request);
  expect(res.status).toBe(413);
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(m.save).not.toHaveBeenCalled();
 });
 it("rejects malformed JSON before profile mutation",async()=>{
  const res=await PUT(put("{"));
  expect(res.status).toBe(400);
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(m.save).not.toHaveBeenCalled();
 });
 it("preserves authorized full-document writer input and private result",async()=>{
  const payload={expectedDocument:{},document:{about:{displayName:"Learner"}}};
  const res=await PUT(put(JSON.stringify(payload)));
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toContain("no-store");
  expect(m.save).toHaveBeenCalledWith(context,payload);
 });
 it("denies CSRF before identity resolution and any private write",async()=>{
  m.origin.mockReturnValue(false);
  const res=await PUT(put("{}"));
  expect(res.status).toBe(403);
  expect(m.context).not.toHaveBeenCalled();
  expect(m.save).not.toHaveBeenCalled();
 });
 it("retains no-store on the public profile API discovery response",async()=>{
  const res=await OPTIONS(new Request("https://campus.example.test/api/profile/me",{method:"OPTIONS"}));
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
 });
});
