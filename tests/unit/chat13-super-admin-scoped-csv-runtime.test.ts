import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:mocks.getCurrentRequestContext,
}));
import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import type {RequestContext} from "@/modules/identity/context";
import type {SuperAdminReadQuery,SuperAdminReadResult} from "@/modules/admin-ui/super-admin-read-directory-model";

const actor={
 user:{id:"administrator",identityUid:"super-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 adminScope:{collegeId:"college-a",organizationId:"organization-a"},
 membership:null,
} as const;

describe("SA-ADMIN-CSV-23 scoped export page cap and CSV injection controls",()=>{
 beforeEach(()=>{
  mocks.getCurrentRequestContext.mockReset();
  mocks.getCurrentRequestContext.mockResolvedValue(actor);
 });
 const url=(q:string)=>new Request("https://local.invalid/api/admin/placements/offers/export?"+q);
 it("exports only first 250 matching rows from 260 despite URL pageSize=100",async()=>{
  const records=Array.from({length:260},(_,i)=>({
   id:"row-"+String(i).padStart(3,"0"),
   title:i===0?"=SUM(1,1)":"Candidate "+i,
   subtitle:"Own college",status:"ISSUED",
   details:["Persisted row "+i],
  }));
  const loader=vi.fn(async(_context:RequestContext,query:SuperAdminReadQuery):Promise<SuperAdminReadResult>=>({
   query,total:records.length,totalPages:11,
   items:records.slice((query.page-1)*query.pageSize,query.page*query.pageSize),
  }));
  const response=await exportSuperAdminScopedDirectory(url("status=ISSUED&pageSize=100"),{
   filename:"offers.csv",statuses:["ALL","ISSUED"],loader,
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Export-Row-Cap")).toBe("250");
  expect(response.headers.get("X-Export-Truncated")).toBe("true");
  const csv=await response.text();
  expect(csv).toContain("row-249");
  expect(csv).not.toContain("row-250");
  expect(csv).toContain("'=SUM(1,1)");
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(loader).toHaveBeenCalledTimes(10);
  for(const [ctx,query] of loader.mock.calls){
   expect(ctx).toBe(actor);
   expect(query.pageSize).toBe(25);
  }
 });
 it("denies unsupported status before loading private report rows",async()=>{
  const loader=vi.fn();
  const response=await exportSuperAdminScopedDirectory(url("status=JOINED"),{
   filename:"offers.csv",statuses:["ALL","ISSUED"],loader,
  });
  expect(response.status).toBe(400);
  expect(loader).not.toHaveBeenCalled();
 });
});
