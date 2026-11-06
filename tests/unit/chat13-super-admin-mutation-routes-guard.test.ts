import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");
const routes=[
 "src/app/api/admin/companies/aliases/route.ts",
 "src/app/api/admin/companies/domains/route.ts",
 "src/app/api/admin/companies/edit/route.ts",
 "src/app/api/admin/companies/merge/route.ts",
 "src/app/api/admin/companies/relationships/route.ts",
 "src/app/api/admin/companies/restore/route.ts",
 "src/app/api/admin/companies/verification/route.ts",
 "src/app/api/admin/placements/drives/bulk/route.ts",
 "src/app/api/admin/placements/jobs/[jobId]/delete/route.ts",
 "src/app/api/admin/placements/jobs/[jobId]/duplicate/route.ts",
 "src/app/api/admin/placements/jobs/[jobId]/edit-published/route.ts",
 "src/app/api/admin/placements/platform-policy/route.ts",
 "src/app/api/projects/[projectId]/submissions/[submissionId]/lock/route.ts",
] as const;

describe("chat-13 Super Admin mutation route CSRF and error boundary contracts",()=>{
 for(const path of routes){
  it(`SA-ADMIN-ROUTE ${path}: origin rejection precedes any untrusted JSON or mutation`,()=>{
   const source=read(path);
   expect(source).toMatch(/isSameOriginRequest\(request\)|from "@\/security\/route"/);
   expect(source).toMatch(/getCurrentRequestContext\(\)|from "@\/security\/route"/);
   expect(source).toContain("apiErrorResponse(");
   const mutation=source.match(/export (?:async function|const) (POST|PUT|PATCH|DELETE)\b/)?.[1];
   expect(mutation).toBeDefined();
   const body=source.slice(Math.max(source.indexOf("export async function "+mutation+"("),source.indexOf("async function handle"+mutation+"(")));
   const origin=body.indexOf("isSameOriginRequest(request)");
   const readers=["request.json()","readAdminPlacementJson(request","readLimitedProjectLockInput(request","readBoundedJsonRequest(request"];
   const firstRead=Math.min(...readers.map(token=>body.indexOf(token))
     .filter(index=>index>=0));
   expect(origin).toBeGreaterThan(0);
   expect(Number.isFinite(firstRead)).toBe(true);
   expect(firstRead).toBeGreaterThan(origin);
   expect(body).toMatch(/403|INVALID_ORIGIN/);
   expect(body).not.toContain("console.log(");
  });
 }
 it("SA-ADMIN-ROUTE-EXPORT permits only authenticated, selected-college, GET-only export helpers",()=>{
  const direct=[
    "src/app/api/admin/companies/export/route.ts",
    "src/app/api/admin/placements/hiring-report/export/route.ts",
  ];
  for(const path of direct){
    const source=read(path);
    expect(source).toMatch(/getCurrentRequestContext\(\)|from "@\/security\/route"/);
    expect(source).not.toMatch(/export (?:async function|const) POST\b/);
  }
  const delegated=[
    "src/app/api/admin/placements/applications/export/route.ts",
    "src/app/api/admin/placements/shortlisted/export/route.ts",
  ];
  const helper=read("src/modules/admin-ui/super-admin-scoped-csv-service.ts");
  for(const path of delegated){
    const source=read(path);
    expect(source).toContain("exportSuperAdminScopedDirectory(");
    expect(source).toMatch(/export (?:async function|const) GET\b/);
    expect(source).not.toMatch(/export (?:async function|const) POST\b/);
  }
  expect(helper).toMatch(/getCurrentRequestContext\(\)|from "@\/security\/route"/);
 });
});
