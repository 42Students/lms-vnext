import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),
 preferences:vi.fn(),outcomes:vi.fn(),prep:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
vi.mock("@/modules/placements/tpo-my-notification-preferences-write",()=>{
 class TpoPreferenceSaveError extends Error{constructor(readonly code:string){super(code);}}
 return {TpoPreferenceSaveError,saveMyTpoNotificationPreferences:mocks.preferences};
});
vi.mock("@/modules/placements/tpo-outcome-label-settings-service",()=>{
 class TpoOutcomeLabelError extends Error{constructor(readonly code:string){super(code);}}
 return {TpoOutcomeLabelError,saveTpoOutcomeLabels:mocks.outcomes};
});
vi.mock("@/modules/placements/tpo-prep-readiness-write-service",()=>{
 class PrepReadinessError extends Error{constructor(readonly code:string){super(code);}}
 return {PrepReadinessError,setTpoPrepReadiness:mocks.prep};
});
import {PUT as preferences} from "@/app/api/placements/tpo/my-notification-preferences/route";
import {PUT as outcomes} from "@/app/api/placements/tpo/settings/outcome-labels/route";
import {PUT as prep} from "@/app/api/placements/tpo/settings/prep-readiness/route";

const actor={user:{id:"authenticated-tpo"},membership:{id:"active-college"}};
const url="https://college.example/api/placements/tpo/settings";
const req=(body:string,headers:Record<string,string>={})=>new Request(url,{
 method:"PUT",headers:{"content-type":"application/json",...headers},body,
});
const specs=[
 {name:"preferences",handler:preferences,save:mocks.preferences,payload:{
  morningDigest:false,recruiterMessages:true,requests:true,resultsReady:true,followUps:true,
  expectedVersion:null,
 }},
 {name:"outcomes",handler:outcomes,save:mocks.outcomes,payload:{
  labels:[],expectedVersion:null,
 }},
 {name:"preparation",handler:prep,save:mocks.prep,payload:{
  courseIds:[],minimumCompleted:0,expectedVersion:"none",
 }},
] as const;
beforeEach(()=>{
 for(const mock of Object.values(mocks))mock.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(actor);
 for(const spec of specs)spec.save.mockResolvedValue({saved:true});
 mocks.error.mockImplementation(()=>NextResponse.json({error:"SAFE_FORBIDDEN",
  message:"Sign in again or ask the administrator to restore access."},{status:403}));
});

describe("TPO-settings-audit-BODY-02 actual bounded college TPO PUT routes",()=>{
 for(const spec of specs){
  it(`${spec.name}: cross-origin PUT is denied before context lookup or service execution`,async()=>{
   mocks.origin.mockReturnValueOnce(false);
   const result=await spec.handler(req(JSON.stringify(spec.payload)));
   expect(result.status).toBe(403);
   expect(await result.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(mocks.context).not.toHaveBeenCalled();
   expect(spec.save).not.toHaveBeenCalled();
  });
  it(`${spec.name}: valid data is delegated with authenticated context, not caller identity`,async()=>{
   const malicious={...spec.payload,userId:"forged",collegeId:"foreign"};
   const result=await spec.handler(req(JSON.stringify(malicious)));
   expect(result.status).toBe(200);
   expect(result.headers.get("Cache-Control")).toBe("private, no-store");
   expect(spec.save).toHaveBeenCalledTimes(1);
   expect(spec.save.mock.calls[0][0]).toBe(actor);
   expect(spec.save.mock.calls[0][1]).toEqual(malicious);
   const value=await result.json();
   expect(value).toEqual({saved:true});
   expect(JSON.stringify(value)).not.toContain("forged");
  });
  it(`${spec.name}: malformed and huge bodies return safe 400/413 without writing`,async()=>{
   for(const [body,status] of [["{invalid",400],["x".repeat(9000),413]] as const){
    const result=await spec.handler(req(body));
    expect(result.status).toBe(status);
    expect(await result.json()).toEqual({error:"INVALID_REQUEST"});
   }
   expect(spec.save).not.toHaveBeenCalled();
  });
  it(`${spec.name}: expired TPO session never calls service and does not expose credentials`,async()=>{
   mocks.context.mockRejectedValueOnce(Error("database password in error"));
   const result=await spec.handler(req(JSON.stringify(spec.payload)));
   expect(result.status).toBe(403);
   expect(JSON.stringify(await result.json())).not.toMatch(/password|database/i);
   expect(spec.save).not.toHaveBeenCalled();
  });
 }
});
