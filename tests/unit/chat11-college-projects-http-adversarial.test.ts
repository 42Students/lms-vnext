import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),
 create:vi.fn(),list:vi.fn(),reassign:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
vi.mock("@/modules/projects/instance-service",()=>({
 createProjectInstance:mocks.create,listProjectInstances:mocks.list,
}));
vi.mock("@/modules/projects/member-service",()=>({
 bulkReassignProjectMentor:mocks.reassign,
}));
import {GET,POST} from "@/app/api/projects/route";
import {POST as POST_REASSIGN} from "@/app/api/projects/reassign-mentor/route";

const user={user:{id:"admin-user",platformStatus:"ACTIVE"},membership:{collegeId:"trusted-college"}};
const id="11111111-1111-4111-8111-111111111111";
const template="22222222-2222-4222-8222-222222222222";
const request=(method:string,data:unknown={})=>new Request("https://college.example/api/projects",{
 method,headers:{"content-type":"application/json"},
 ...(method==="GET"?{}:{body:JSON.stringify(data)}),
});
beforeEach(()=>{
 for(const f of Object.values(mocks))f.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(user);
 mocks.create.mockResolvedValue({id,title:"Workspace"});
 mocks.list.mockResolvedValue([{id,title:"Workspace"}]);
 mocks.reassign.mockResolvedValue({updated:1,skipped:0});
 mocks.error.mockImplementation(()=>NextResponse.json({
  error:"SAFE_CONFLICT",message:"The Project changed; refresh and retry.",
 },{status:409}));
});

describe("PROJ-BREAK-COL-HTTP-01 actual College Admin Projects API boundaries",()=>{
 for(const [name,handler,service] of [
  ["create",POST,mocks.create],["mentor reassignment",POST_REASSIGN,mocks.reassign],
 ] as const){
  it(`rejects cross-origin ${name} before loading a user or invoking any service`,async()=>{
   mocks.origin.mockReturnValueOnce(false);
   const res=await handler(request("POST",{collegeId:"foreign",userId:"forged"}));
   expect(res.status).toBe(403);
   expect(await res.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(mocks.context).not.toHaveBeenCalled();
   expect(service).not.toHaveBeenCalled();
  });
  it(`uses server principal rather than forged user data on ${name}`,async()=>{
   const submitted={collegeId:"foreign",userId:"forged",expectedUpdatedAt:"2026-10-18T11:00:00Z"};
   const res=await handler(request("POST",submitted));
   expect(res.status).toBe(name==="create"?201:200);
   expect(service).toHaveBeenCalledTimes(1);
   expect(service.mock.calls[0][0]).toBe(user);
   expect(service.mock.calls[0][1]).toEqual(submitted);
   expect(JSON.stringify(await res.json())).not.toContain("forged");
  });
  it(`maps stale-tab/expired-session ${name} failures without exposing internals`,async()=>{
   service.mockRejectedValueOnce(new Error("SQL internal secret"));
   const res=await handler(request("POST",{}));
   expect(res.status).toBe(409);
   expect(JSON.stringify(await res.json())).not.toMatch(/SQL internal|secret/);
   expect(mocks.error).toHaveBeenCalledTimes(1);
  });
 }
 it("GET project listing is read-only and lets server-side scope checks reject forged college",async()=>{
  const req=new Request("https://college.example/api/projects?collegeId="+id,{method:"GET"});
  const res=await GET(req);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({projects:[{id,title:"Workspace"}]});
  expect(mocks.list).toHaveBeenCalledWith(user,id);
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.reassign).not.toHaveBeenCalled();
  expect(mocks.origin).not.toHaveBeenCalled();
 });
 it("GET unauthorized college read does not return foreign project data",async()=>{
  mocks.list.mockRejectedValueOnce(new Error("PROJECT_ACCESS_DENIED: db secret"));
  const req=new Request("https://college.example/api/projects?collegeId="+id,{method:"GET"});
  const res=await GET(req);
  expect(res.status).toBe(409);
  expect(JSON.stringify(await res.json())).not.toContain("secret");
 });
});
