import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/projects/reassign-mentor/route";
import {ProjectsServiceError} from "@/modules/projects/errors";

const state=vi.hoisted(()=>({
  origin:true,contextReads:0,serviceCalls:0,
  failure:"" as ""|"forbidden"|"internal",
}));
vi.mock("@/auth/origin",()=>({
  isSameOriginRequest:()=>state.origin,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{
    state.contextReads++;
    return {user:{id:"actor",identityUid:"admin",platformStatus:"ACTIVE",
      systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
  },
}));
vi.mock("@/modules/projects/member-service",()=>({
  bulkReassignProjectMentor:async()=>{
    state.serviceCalls++;
    if(state.failure==="forbidden")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
    if(state.failure==="internal")throw Error("PRIVATE_DB_CONNECTION_PASSWORD");
    return {reassignedCount:1,skippedCount:0,failures:[],
      taskAssignmentClearingSupported:true};
  },
}));
const request=()=>new Request("https://example.invalid/api/projects/reassign-mentor",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({
    collegeId:"11111111-1111-4111-8111-111111111111",
    projectIds:["22222222-2222-4222-8222-222222222222"],
    mentorMembershipId:"33333333-3333-4333-8333-333333333333",
  }),
});
beforeEach(()=>{
  state.origin=true;state.contextReads=0;state.serviceCalls=0;state.failure="";
});
describe("IIT Dharwad Projects: bulk mentor mutation route same-origin and friendly failures",()=>{
  it("PROJ-BREAK-routing-117 cross-origin POST rejects before session or JSON body is inspected",async()=>{
    state.origin=false;
    const req=request(),bodyRead=vi.spyOn(req,"json");
    const response=await POST(req);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
    expect(bodyRead).not.toHaveBeenCalled();
    expect(state.contextReads).toBe(0);
    expect(state.serviceCalls).toBe(0);
  });
  it("PROJ-BREAK-routing-118 same-origin authorized POST delegates once and returns the exact result",async()=>{
    const response=await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      reassignedCount:1,skippedCount:0,failures:[],
      taskAssignmentClearingSupported:true,
    });
    expect(state.contextReads).toBe(1);
    expect(state.serviceCalls).toBe(1);
  });
  it("PROJ-BREAK-routing-119 denied persisted scope is a non-leaking forbidden response",async()=>{
    state.failure="forbidden";
    const response=await POST(request());
    expect(response.status).toBe(403);
    const body=await response.json();
    expect(body).toMatchObject({error:"PROJECT_ACCESS_DENIED"});
    expect(body.message).toEqual(expect.any(String));
    expect(body.requestId).toEqual(expect.any(String));
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
  it("PROJ-BREAK-routing-120 an unexpected failure never leaks database internals or claims a partial success",async()=>{
    state.failure="internal";
    const response=await POST(request());
    expect(response.status).toBe(500);
    const json=await response.json();
    expect(JSON.stringify(json)).not.toContain("PRIVATE_DB_CONNECTION_PASSWORD");
    expect(json.message).toEqual(expect.any(String));
    expect(json.requestId).toEqual(expect.any(String));
  });
});
