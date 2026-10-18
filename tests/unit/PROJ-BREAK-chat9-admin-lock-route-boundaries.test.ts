import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/projects/[projectId]/submissions/[submissionId]/lock/route";
import {ProjectsServiceError} from "@/modules/projects/errors";

const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
  sameOrigin:true,contextReads:0,locks:0,denied:false,
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.sameOrigin}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{
    state.contextReads++;
    return {user:{id:"actor",identityUid:"staff",platformStatus:"ACTIVE",systemRoles:[]}};
  },
}));
vi.mock("@/modules/projects/admin-submission-review-service",()=>({
  lockAdminProjectSubmission:async()=>{
    state.locks++;
    if(state.denied)throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
    return {id:submissionId,status:"SUBMITTED",lockedAt:"2026-10-18T10:00:00.000Z"};
  },
}));
const params={params:Promise.resolve({projectId,submissionId})};
function command(body:string,headers:Record<string,string>={}){
  return new Request("https://example.invalid/api/projects/"+projectId+"/submissions/"+submissionId+"/lock",{
    method:"POST",headers:{"content-type":"application/json",...headers},body,
  });
}
beforeEach(()=>{state.sameOrigin=true;state.contextReads=0;state.locks=0;state.denied=false;});

describe("IIT Dharwad Projects: delivery lock route authorization and streamed body caps",()=>{
  it("PROJ-BREAK-routing-121 foreign origin returns 403 before body, context and service",async()=>{
    state.sameOrigin=false;
    const req=command('{"reason":"Review accepted"}');
    const body=vi.spyOn(req,"json");
    const response=await POST(req,params);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
    expect(body).not.toHaveBeenCalled();
    expect(state.contextReads).toBe(0);
    expect(state.locks).toBe(0);
  });
  it("PROJ-BREAK-routing-122 oversize actual byte count rejects before private role lookup",async()=>{
    const reason="💡".repeat(2500);
    const response=await POST(command(JSON.stringify({reason})),params);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
    expect(state.contextReads).toBe(0);
    expect(state.locks).toBe(0);
  });
  it("PROJ-BREAK-routing-123 malformed JSON and forged content length fail closed",async()=>{
    for(const req of [
      command("{bad"),
      command('{"reason":"ok"}',{"content-length":"999999"}),
      command('{"reason":"ok"}',{"content-length":"1e3"}),
    ]){
      const response=await POST(req,params);
      expect(response.status).toBe(400);
    }
    expect(state.contextReads).toBe(0);
    expect(state.locks).toBe(0);
  });
  it("PROJ-BREAK-routing-124 authorized submission lock is private and delegates once",async()=>{
    const response=await POST(command('{"reason":"Final review"}'),params);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toMatchObject({submission:{id:submissionId,status:"SUBMITTED"}});
    expect(state.contextReads).toBe(1);
    expect(state.locks).toBe(1);
  });
  it("PROJ-BREAK-routing-125 revoked role maps to actionable forbidden response without leaking internals",async()=>{
    state.denied=true;
    const response=await POST(command('{"reason":"Final review"}'),params);
    expect(response.status).toBe(403);
    const json=await response.json();
    expect(json.error).toBe("PROJECT_LIFECYCLE_ACCESS_DENIED");
    expect(json.message).toEqual(expect.any(String));
    expect(json.requestId).toEqual(expect.any(String));
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});
