import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {requestPublicJoinCode} from "@/modules/placements/public-join/send-code-service";
import {acceptPublicRecruiterJoin} from "@/modules/placements/public-join/join-service";
import {POST as companyCode} from "@/app/api/public/company-join/send-code/route";
import {POST as collegeCode} from "@/app/api/public/college-join/send-code/route";
import {POST as companyJoin} from "@/app/api/public/company-join/join/route";
import {POST as collegeJoin} from "@/app/api/public/college-join/join/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/public-join/send-code-service",()=>({
 requestPublicJoinCode:vi.fn(),
 PublicJoinCodeError:class PublicJoinCodeError extends Error{
  constructor(readonly code:string){super(code);}
 },
}));
vi.mock("@/modules/placements/public-join/join-service",()=>({
 acceptPublicRecruiterJoin:vi.fn(),
 PublicJoinAcceptError:class PublicJoinAcceptError extends Error{
  constructor(readonly code:string){super(code);}
 },
}));
const url="https://college.example.edu/api/public/join";
const req=(body:BodyInit,ip="192.0.2.20")=>new Request(url,{
 method:"POST",headers:{
  host:"college.example.edu","content-type":"application/json",
  "x-public-verified-client-ip":ip,
 },body,
});
const routes=[companyCode,collegeCode,companyJoin,collegeJoin] as const;
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(requestPublicJoinCode).mockResolvedValue({sent:true,companyName:null});
 vi.mocked(acceptPublicRecruiterJoin).mockResolvedValue({
  joined:true,outcome:"JOINED",signInEmail:"recruiter@example.org",
 });
});
afterEach(()=>vi.unstubAllEnvs());

describe("chat-16 anonymous college/company join POST byte limits and trust boundaries",()=>{
 it("PUBLIC-JOIN-SIZE-30 rejects oversize UTF-8 bodies for all four routes before privileged service access",async()=>{
  for(const route of routes){
   const response=await route(req("é".repeat(5000)));
   expect(response.status).toBe(413);
   expect(response.headers.get("cache-control")).toBe("no-store");
   expect(await response.json()).toEqual({error:"REQUEST_TOO_LARGE"});
  }
  expect(requestPublicJoinCode).not.toHaveBeenCalled();
  expect(acceptPublicRecruiterJoin).not.toHaveBeenCalled();
 });
 it("PUBLIC-JOIN-SIZE-31 rejects malformed/invalid UTF-8 JSON without accepting an invitation",async()=>{
  for(const route of routes){
   expect((await route(req("{broken-json"))).status).toBe(400);
   const bad=new Request(url,{
    method:"POST",headers:{"content-type":"application/json"},
    body:new Blob([Uint8Array.of(0xff)]),
   });
   expect((await route(bad)).status).toBe(400);
  }
  expect(requestPublicJoinCode).not.toHaveBeenCalled();
  expect(acceptPublicRecruiterJoin).not.toHaveBeenCalled();
 });
 it("PUBLIC-JOIN-SIZE-32 checks same origin before consuming any request body",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  for(const route of routes){
   expect((await route(req("a".repeat(10_000)))).status).toBe(403);
  }
  expect(requestPublicJoinCode).not.toHaveBeenCalled();
  expect(acceptPublicRecruiterJoin).not.toHaveBeenCalled();
 });
 it("PUBLIC-JOIN-SIZE-33 preserves scope-aware success and denies spoofed proxy IP without verification",async()=>{
  vi.stubEnv("PUBLIC_JOIN_TRUSTED_PROXY_READY","");
  const input=JSON.stringify({email:"recruiter@example.org",token:"example-token"});
  expect((await companyCode(req(input))).status).toBe(200);
  expect((await collegeCode(req(input))).status).toBe(200);
  expect((await companyJoin(req(input))).status).toBe(200);
  expect((await collegeJoin(req(input))).status).toBe(200);
  expect(requestPublicJoinCode).toHaveBeenNthCalledWith(1,"COMPANY",expect.any(Object),null,expect.any(Function));
  expect(requestPublicJoinCode).toHaveBeenNthCalledWith(2,"COLLEGE",expect.any(Object),null,expect.any(Function));
  expect(acceptPublicRecruiterJoin).toHaveBeenNthCalledWith(1,"COMPANY",expect.any(Object),null);
  expect(acceptPublicRecruiterJoin).toHaveBeenNthCalledWith(2,"COLLEGE",expect.any(Object),null);
  vi.stubEnv("PUBLIC_JOIN_TRUSTED_PROXY_READY","VERIFIED");
  await companyCode(req(input));
  expect(requestPublicJoinCode).toHaveBeenLastCalledWith("COMPANY",expect.any(Object),"192.0.2.20",expect.any(Function));
 });
});