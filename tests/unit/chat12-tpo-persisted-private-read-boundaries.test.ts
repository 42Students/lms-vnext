import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
const resources=[
 ["src/app/(authenticated)/tpo/students/page.tsx","const incoming=await searchParams;"],
 ["src/app/(authenticated)/tpo/companies/page.tsx","const raw = await searchParams;"],
 ["src/app/api/placements/tpo/students/export/route.ts","const filters = tpoStudentsQuerySchema"],
 ["src/app/api/placements/tpo/companies/export/route.ts","const parsed=tpoCompaniesQuerySchema"],
] as const;
describe("PROJ-BREAK-TPO-READ-07 expired/revoked role cannot open student and company data routes",()=>{
 for(const [path,access] of resources){
  it(`requires persisted actor before reading private student or company data: ${path}`,()=>{
   const src=read(path);
   expect(src).toContain("getCurrentRequestContext");
   const persisted=src.indexOf("await requireTpoBatchActor(context)");
   expect(persisted).toBeGreaterThanOrEqual(0);
   expect(persisted).toBeLessThan(src.indexOf(access));
   expect(src).not.toContain("readPublicCompanyDirectory(");
  });
 }
 it("the persisted actor helper checks user and membership activity plus exact TPO/CA role",()=>{
  const src=read("src/modules/placements/tpo-batch-workspace-read-service.ts");
  const start=src.indexOf("export async function requireTpoBatchActor(");
  expect(start).toBeGreaterThanOrEqual(0);
  const gate=src.slice(start,src.indexOf("export async function listTpoBatches",start));
  expect(gate).toContain('eq(collegeMemberships.userId,ctx.user.id)');
  expect(gate).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(gate).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(gate).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(gate).toContain('requirePermission(ctx,"placements.manage"');
 });
});
