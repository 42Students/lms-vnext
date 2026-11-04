import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),permission:vi.fn(),
 list:vi.fn(),assigned:vi.fn(),create:vi.fn(),detail:vi.fn(),
 revise:vi.fn(),archive:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/permissions/policy",()=>({requirePermission:mocks.permission}));
vi.mock("@/modules/projects/template-service",()=>({
 listProjectTemplates:mocks.list,
 listAssignedProjectTemplates:mocks.assigned,
 createProjectTemplate:mocks.create,
 getProjectTemplateDetail:mocks.detail,
 reviseProjectTemplate:mocks.revise,
 archiveProjectTemplate:mocks.archive,
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>NextResponse.json({error:"INVALID_REQUEST"},{status:400}),
}));

import {GET as listTemplates,POST as createTemplate}
 from "@/app/api/projects/templates/route";
import {GET as getTemplate,PATCH as reviseTemplate,PUT as reviseLegacyTemplate,DELETE as archiveTemplate}
 from "@/app/api/projects/templates/[templateId]/route";

const base="https://college.example.test";
const id="11111111-1111-4111-8111-111111111111";
const ctx={user:{id:"22222222-2222-4222-8222-222222222222"}};
const big=JSON.stringify({title:"x".repeat(8*1024*1024)});
const make=(method:string,route:string,body?:string)=>new Request(base+route,{
 method,headers:{host:"college.example.test",origin:base,
  "content-type":"application/json"},
 ...(body===undefined?{}:{body}),
});
const detailArgs={params:Promise.resolve({templateId:id})};
function noWrites(){
 expect(mocks.create).not.toHaveBeenCalled();
 expect(mocks.revise).not.toHaveBeenCalled();
 expect(mocks.archive).not.toHaveBeenCalled();
}

beforeEach(()=>{
 vi.clearAllMocks();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(ctx);
 mocks.list.mockResolvedValue([]);
 mocks.assigned.mockResolvedValue([]);
 mocks.create.mockResolvedValue({template:{id}});
 mocks.detail.mockResolvedValue({template:{id,title:"Template",summary:null,currentVersion:1},
  currentVersion:{blueprint:{}}});
 mocks.revise.mockResolvedValue({template:{id}});
 mocks.archive.mockResolvedValue({id});
});

describe("project-template API resource selectors and body limits",()=>{
 it.each(["?collegeId=","?collegeId=not-a-uuid",
  "?collegeId="+id+"&collegeId="+id])(
  "denies ambiguous or invalid template college selector %s",async suffix=>{
   const res=await listTemplates(make("GET","/api/projects/templates"+suffix));
   expect(res.status).toBe(400);
   expect(res.headers.get("cache-control")).toContain("no-store");
   expect(mocks.list).not.toHaveBeenCalled();
   expect(mocks.assigned).not.toHaveBeenCalled();
  });
 it.each(["?collegeId=","?collegeId=broken",
  "?collegeId="+id+"&collegeId="+id])(
  "rejects invalid/detail duplicate tenant hints without resolving the private record %s",
  async suffix=>{
   const response=await getTemplate(make("GET","/api/projects/templates/"+id+suffix),
     detailArgs);
   expect(response.status).toBe(400);
   expect(response.headers.get("cache-control")).toContain("no-store");
   expect(mocks.detail).not.toHaveBeenCalled();
  });
 it("denies a foreign detail tenant hint before protected detail lookup",async()=>{
  mocks.context.mockResolvedValue({user:ctx.user,membership:{collegeId:id}});
  const other="33333333-3333-4333-8333-333333333333";
  const response=await getTemplate(
    make("GET","/api/projects/templates/"+id+"?collegeId="+other),detailArgs);
  expect(response.status).toBe(403);
  expect(mocks.detail).not.toHaveBeenCalled();
 });
 it("preserves explicitly scoped and no-selector authenticated template reads",async()=>{
  const scoped=await listTemplates(make("GET","/api/projects/templates?collegeId="+id));
  expect(scoped.status).toBe(200);
  expect(mocks.assigned).toHaveBeenCalledWith(ctx,id);
  const global=await listTemplates(make("GET","/api/projects/templates"));
  expect(global.status).toBe(200);
  expect(mocks.list).toHaveBeenCalledWith(ctx);
  expect(global.headers.get("cache-control")).toContain("no-store");
 });
 it("denies 8MiB-plus create payload before template creation",async()=>{
  const req=make("POST","/api/projects/templates",big);
  req.headers.set("content-length","1");
  const res=await createTemplate(req);
  expect(res.status).toBe(413);
  expect(res.headers.get("cache-control")).toContain("no-store");
  noWrites();
 });
 it.each(["PATCH","PUT"])(
  "denies 8MiB-plus %s before template version lookup or write",async method=>{
   const fn=method==="PATCH"?reviseTemplate:reviseLegacyTemplate;
   const res=await fn(make(method,"/api/projects/templates/"+id,big),detailArgs);
   expect(res.status).toBe(413);
   expect(mocks.detail).not.toHaveBeenCalled();
   noWrites();
 });
 it("denies malformed create and PATCH JSON without a writer",async()=>{
  expect((await createTemplate(make("POST","/api/projects/templates","{"))).status).toBe(400);
  expect((await reviseTemplate(make("PATCH","/api/projects/templates/"+id,"{"),detailArgs)).status).toBe(400);
  noWrites();
 });
 it("preserves authorized create and version-checked section PATCH",async()=>{
  const input={title:"Template",blueprint:{}};
  const created=await createTemplate(make("POST","/api/projects/templates",JSON.stringify(input)));
  expect(created.status).toBe(201);
  expect(mocks.create).toHaveBeenCalledWith(ctx,input);
  const revised=await reviseTemplate(make("PATCH","/api/projects/templates/"+id,
   JSON.stringify({expectedVersion:1,overview:{goal:"Updated goal"}})),detailArgs);
  expect(revised.status).toBe(200);
  expect(mocks.detail).toHaveBeenCalledWith(ctx,id);
  expect(mocks.revise).toHaveBeenCalledWith(ctx,id,expect.objectContaining({
   expectedVersion:1,title:"Template",blueprint:expect.objectContaining({
    overview:expect.objectContaining({goal:"Updated goal"}),
   }),
  }));
  expect(revised.headers.get("cache-control")).toContain("no-store");
 });
 it("preserves authorized template archive",async()=>{
  const res=await archiveTemplate(make("DELETE","/api/projects/templates/"+id),detailArgs);
  expect(res.status).toBe(200);
  expect(mocks.archive).toHaveBeenCalledWith(ctx,id);
  expect(res.headers.get("cache-control")).toContain("no-store");
 });
 it("denies cross-origin mutations before requesting a session or touching services",async()=>{
  mocks.origin.mockReturnValue(false);
  const res=await createTemplate(make("POST","/api/projects/templates","{}"));
  expect(res.status).toBe(403);
  expect(mocks.context).not.toHaveBeenCalled();
  noWrites();
 });
});
