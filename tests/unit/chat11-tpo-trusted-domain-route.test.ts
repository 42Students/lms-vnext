import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const stubs=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),change:vi.fn(),apiError:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:stubs.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:stubs.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:stubs.apiError}));
vi.mock("@/modules/placements/tpo-trusted-domains-write-service",()=>{
 class TpoTrustedDomainError extends Error{
  constructor(readonly code:string){super(code);}
 }
 return {TpoTrustedDomainError,changeTpoTrustedDomain:stubs.change};
});
import {POST} from "@/app/api/placements/tpo/trusted-domains/route";
import {TpoTrustedDomainError} from "@/modules/placements/tpo-trusted-domains-write-service";

const actor={user:{id:"logged-in"},membership:{id:"current-college"}};
const request=(body:string)=>
 new Request("https://college.example/api/placements/tpo/trusted-domains",{
  method:"POST",headers:{"content-type":"application/json"},body,
 });
beforeEach(()=>{
 for(const stub of Object.values(stubs))stub.mockReset();
 stubs.origin.mockReturnValue(true);
 stubs.context.mockResolvedValue(actor);
 stubs.change.mockResolvedValue({domain:"careers.example",trusted:true});
 stubs.apiError.mockImplementation(()=>NextResponse.json({error:"ACCESS_DENIED"},{status:403}));
});

describe("TPO-settings-audit-TRUST-03 signed-in employer domain mutation endpoint",()=>{
 it("blocks forged origin before loading session or service",async()=>{
  stubs.origin.mockReturnValueOnce(false);
  const response=await POST(request(JSON.stringify({action:"TRUST",domain:"careers.example"})));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(stubs.context).not.toHaveBeenCalled();
  expect(stubs.change).not.toHaveBeenCalled();
 });
 it("hands an authenticated principal to the service, not user IDs supplied by the request",async()=>{
  const submitted={action:"TRUST",domain:"careers.example",userId:"forged",collegeId:"foreign"};
  const response=await POST(request(JSON.stringify(submitted)));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({domain:"careers.example",trusted:true});
  expect(stubs.change).toHaveBeenCalledWith(actor,submitted);
  expect(stubs.change).toHaveBeenCalledTimes(1);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
 });
 it("rejects malformed and oversized JSON with no mutation or raw input exposure",async()=>{
  for(const [body,status] of [["{bad",400],["x".repeat(9000),413]] as const){
   const response=await POST(request(body));
   expect(response.status).toBe(status);
   expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
  }
  expect(stubs.change).not.toHaveBeenCalled();
 });
 it("maps duplicate and absent-domain conflicts to known response statuses",async()=>{
  for(const code of ["DOMAIN_ALREADY_TRUSTED","DOMAIN_NOT_FOUND"] as const){
   stubs.change.mockRejectedValueOnce(new TpoTrustedDomainError(code));
   const response=await POST(request('{"action":"TRUST","domain":"careers.example"}'));
   expect(response.status).toBe(409);
   expect((await response.json()).error).toBe(code);
  }
 });
 it("denies an expired or revoked session via a safe error mapper",async()=>{
  stubs.context.mockRejectedValueOnce(new Error("credential in raw database error"));
  const response=await POST(request('{"action":"TRUST","domain":"careers.example"}'));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"ACCESS_DENIED"});
  expect(stubs.change).not.toHaveBeenCalled();
 });
});
