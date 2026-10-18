import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {adminUnsubmittedQuerySchema,adminUnsubmittedLiteralSearchPattern} from "@/modules/projects/admin-unsubmitted-query-model";
const source=(p:string)=>readFileSync(p,"utf8");

describe("Super Admin not-submitted Projects directory abuse",()=>{
 it("PROJ-BREAK-SA-20 interprets SQL wildcards and backslashes literally",()=>{
  const escaped=adminUnsubmittedLiteralSearchPattern("100%_\\pilot");
  expect(escaped).toBe("%100\\%\\_\\\\pilot%");
  expect(adminUnsubmittedLiteralSearchPattern("Alpha")).toBe("%Alpha%");
  expect(adminUnsubmittedLiteralSearchPattern("")).toBe("%%");
  expect(adminUnsubmittedLiteralSearchPattern("%")).toBe("%\\%%");
  expect(adminUnsubmittedLiteralSearchPattern("_")).toBe("%\\_%");
 });
 it("PROJ-BREAK-SA-21 enforces bounded paging, trimmed search and forbids arbitrary query keys",()=>{
  expect(adminUnsubmittedQuerySchema.parse({})).toEqual({page:1,pageSize:25});
  expect(adminUnsubmittedQuerySchema.parse({q:"  ABC  ",page:"2",pageSize:"100"})).toEqual({q:"ABC",page:2,pageSize:100});
  for(const raw of [
   {page:0},{page:"-1"},{page:"NaN"},{page:100001},
   {pageSize:0},{pageSize:101},{pageSize:12.4},{q:"x".repeat(121)},
   {collegeId:"foreign"},{status:"ARCHIVED"},{page:1,extra:"bypass"},
  ])expect(adminUnsubmittedQuerySchema.safeParse(raw).success,JSON.stringify(raw)).toBe(false);
 });
 it("PROJ-BREAK-SA-26 applies literal ILIKE escaping to all three Super Admin project list views",()=>{
  const s=source("src/modules/projects/admin-insights-service.ts");
  const found=s.split('const searchPattern=adminUnsubmittedLiteralSearchPattern(query.q??"");').length-1;
  expect(found).toBe(3);
  // Each workspace view must search a persisted UUID as well as literal
  // title and slug text, without widening the college predicate.
  expect(s.split('projectInstances.id}::text ilike ${searchPattern}').length-1).toBe(3);
  expect(s.split('eq(projectInstances.collegeId, college.id)').length-1).toBeGreaterThanOrEqual(3);
  expect(s).toContain('import {adminUnsubmittedLiteralSearchPattern} from "./admin-unsubmitted-query-model"');
  expect(s).not.toContain('`%'+ '${query.q}' + '%`');
  expect(s).not.toContain('"%"+query.q+"%"');
  expect(s).toContain('projectInstances.title,\n          searchPattern,');
  expect(s).toContain('projectInstances.slug,\n          searchPattern,');
  expect(s).toContain('projectInstances.id}::text ilike ${searchPattern}');
 });
 it("PROJ-BREAK-SA-22 keeps selected-college authorization, archive exclusion and SQL NOT EXISTS on the query itself",()=>{
  const s=source("src/modules/projects/admin-unsubmitted-service.ts");
  expect(s).toContain("loadProjectCollegeScope(collegeId)");
  expect(s).toContain('requirePermission(context,"projects.manage",{organizationId:college.organizationId,collegeId:college.id})');
  expect(s).toContain('eq(projectInstances.collegeId,college.id)');
  expect(s).toContain('ne(projectInstances.status,"ARCHIVED")');
  expect(s).toContain("notExists(");
  expect(s).toContain("eq(projectSubmissions.projectId,projectInstances.id)");
  expect(s).toContain("adminUnsubmittedLiteralSearchPattern(q.q??\"\")");
  expect(s).toContain(".limit(q.pageSize).offset((q.page-1)*q.pageSize)");
 });
});
