import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(path,"utf8");
describe("G2-18-026-048 Super Admin program server directory",()=>{
 it("wires selected-college pagination to a bounded SQL reader",()=>{
  const page=read("src/app/(authenticated)/admin/programs/page.tsx");
  const service=read("src/modules/academics/program-service.ts");
  expect(page).toContain("listProgramsPage(context,collegeId,filters.data)");
  expect(page).not.toContain("listPrograms(context,collegeId)");
  expect(page).toContain("pageSize:z.coerce.number().int().min(1).max(100).default(20)");
  const reader=service.slice(service.indexOf("export async function listProgramsPage("));
  expect(reader).toContain("q ? or(ilike(programs.name, searchPattern)");
  expect(reader).toContain("q.replace(/[\\\\%_]/g, \"\\\\expect(reader).toContain("q ? or(ilike(programs.name,like)");\")");
  expect(reader).toContain(".limit(pageSize).offset((page - 1) * pageSize)");
  expect(reader).toContain("eq(departments.collegeId, collegeId)");
 });
 it("filters and pages on the server while retaining legacy create controls",()=>{
  const view=read("src/components/admin/admin-program-directory.tsx");
  expect(view).toContain("const filtered = serverPage ? [...programs]");
  expect(view).toContain("router.replace(hrefFor(1,pageSize,search))");
  expect(view).toContain('params.set("page",String(nextPage))');
  expect(view).toContain('params.set("pageSize",String(nextSize))');
  expect(view).toContain('serverPage?"Export CSV (page)":"Export CSV"');
  expect(view).toContain('aria-label="Create New Program"');
 });
});
