import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportSuperAdminScopedDirectory } from "@/modules/admin-ui/super-admin-scoped-csv-service";
import type { RequestContext } from "@/modules/identity/context";
import type { SuperAdminReadQuery, SuperAdminReadResult } from "@/modules/admin-ui/super-admin-read-directory-model";

const mocks=vi.hoisted(()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.getCurrentRequestContext}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:()=>new Response("Service unavailable",{status:503})}));

const admin:RequestContext={
 user:{id:"admin-a",identityUid:"admin-a",systemRoles:["SUPER_ADMIN"],platformStatus:"ACTIVE"},
 adminScope:{organizationId:"organization-a",collegeId:"college-a"},
 membership:null,
};
const config=(loader:(context:RequestContext,query:SuperAdminReadQuery)=>Promise<SuperAdminReadResult>)=>({
 filename:"super-admin-placements.csv",statuses:["ALL"],loader,
});

describe("SA-SCOPED-CSV-CAP-05 honor 250-row export cap, independently of UI page size",()=>{
 beforeEach(()=>mocks.getCurrentRequestContext.mockReset().mockResolvedValue(admin));

 for(const injectedPageSize of [10,100]){
  it("normalizes the adversarial pageSize="+injectedPageSize+" across all export pages",async()=>{
   const loader=vi.fn(async(_context:RequestContext,query:SuperAdminReadQuery):Promise<SuperAdminReadResult>=>({
    query,total:251,totalPages:Math.ceil(251/query.pageSize),
    items:Array.from({length:query.pageSize},(_,i)=>({
      id:"row-"+query.page+"-"+i,title:"Learner "+i,
      subtitle:"Selected college",status:"ALL",details:["Authorized row"],
    })),
   }));
   const request=new Request("https://example.test/admin/placements/applications/export?pageSize="+injectedPageSize+"&q=learner");
   const response=await exportSuperAdminScopedDirectory(request,config(loader));
   expect(response.status).toBe(200);
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
   expect(response.headers.get("X-Export-Row-Cap")).toBe("250");
   expect(response.headers.get("X-Export-Truncated")).toBe("true");
   const csv=await response.text();
   expect((csv.match(/"row-/g)??[])).toHaveLength(250);
   expect(csv).toContain("EXPORT TRUNCATED");
   expect(csv).not.toContain('"row-11-0"');
   expect(loader).toHaveBeenCalledTimes(10);
   for(const [index,call] of loader.mock.calls.entries()){
    const [context,query]=call;
    expect(context).toEqual(admin);
    expect(query).toMatchObject({page:index+1,pageSize:25,q:"learner"});
   }
  });
 }

 it("preserves a complete 25-row export without a misleading truncation notice",async()=>{
  const loader=vi.fn(async(_context:RequestContext,query:SuperAdminReadQuery):Promise<SuperAdminReadResult>=>({
   query,total:25,totalPages:1,items:Array.from({length:25},(_,i)=>({
    id:"row-1-"+i,title:"Learner "+i,subtitle:"College",status:"ALL",details:[],
   })),
  }));
  const result=await exportSuperAdminScopedDirectory(
   new Request("https://example.test/export?pageSize=100"),config(loader));
  expect(result.headers.get("X-Export-Truncated")).toBe("false");
  expect((await result.text()).includes("EXPORT TRUNCATED")).toBe(false);
  expect(loader).toHaveBeenCalledTimes(1);
  expect(loader.mock.calls[0]?.[1].pageSize).toBe(25);
 });

 it("rejects an unauthorized status before calling any directory loader",async()=>{
  const loader=vi.fn(async(_context:RequestContext,query:SuperAdminReadQuery):Promise<SuperAdminReadResult>=>({
   query,total:0,totalPages:1,items:[],
  }));
  const response=await exportSuperAdminScopedDirectory(
   new Request("https://example.test/export?status=ARCHIVED"),config(loader));
  expect(response.status).toBe(400);
  expect(loader).not.toHaveBeenCalled();
 });
});
