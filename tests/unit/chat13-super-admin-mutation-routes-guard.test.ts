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
   expect(source).toContain("isSameOriginRequest(request)");
   expect(source).toContain("getCurrentRequestContext()");
   expect(source).toContain("apiErrorResponse(");
   const mutation=source.match(/export async function (POST|PUT|PATCH|DELETE)\(/)?.[1];
   expect(mutation).toBeDefined();
   const body=source.slice(source.indexOf("export async function "+mutation+"("));
   const origin=body.indexOf("isSameOriginRequest(request)");
   const json=body.indexOf("request.json()");
   expect(origin).toBeGreaterThan(0);
   expect(json).toBeGreaterThan(origin);
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
    expect(source).toContain("getCurrentRequestContext()");
    expect(source).not.toContain("export async function POST(");
  }
  const delegated=[
    "src/app/api/admin/placements/applications/export/route.ts",
    "src/app/api/admin/placements/shortlisted/export/route.ts",
  ];
  const helper=read("src/modules/admin-ui/super-admin-scoped-csv-service.ts");
  for(const path of delegated){
    const source=read(path);
    expect(source).toContain("exportSuperAdminScopedDirectory(");
    expect(source).toContain("export async function GET(");
    expect(source).not.toContain("export async function POST(");
  }
  expect(helper).toContain("getCurrentRequestContext()");
 });
});
