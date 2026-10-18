import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const page=(route:string)=>read("src/app/(authenticated)"+route+"/page.tsx");

describe("chat-9 route coverage and native DataTable closure",()=>{
 it("UX-admin-settings-04 /admin/settings replaces both raw inventory tables with mobile-safe DataTable",()=>{
  const source=page("/admin/settings");
  expect(source.match(/<DataTable</g)?.length).toBe(2);
  expect(source).not.toMatch(/<table\b/);
  for(const heading of ["Source file or table","Source template / key","Declared channels","Definition","Source file"])
   expect(source).toContain(heading);
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).toContain("No visible settings match the selected filters.");
  expect(source).toContain("No source templates match the selected filters.");
 });
 it("UX-admin-course-progress-students-01 /admin/course-progress/students protects report totals and mobile student fields",()=>{
  const source=page("/admin/course-progress/students");
  expect(source).toContain('caption="Student Course Progress"');
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).toContain("studentCourseCompletion");
  expect(source).toContain("No students are enrolled in this course offering.");
  expect(source).toContain("Showing the first 500 students.");
  expect(source).not.toContain("<main");
  expect(source).not.toMatch(/<table\b/);
 });
 it("UX-admin-features-collegeId-trace-04 /admin/features/[collegeId]/trace keeps the winner and ignored statuses in a scroll-safe table",()=>{
  const source=page("/admin/features/[collegeId]/trace");
  expect(source.match(/<DataTable</g)?.length).toBe(2);
  expect(source).not.toMatch(/<table\b/);
  expect(source).toContain("MODULE_SCOPE_LABELS");
  expect(source).toContain("describeStoredOverride");
  expect(source).toContain('<StatusBadge tone="success">Winner</StatusBadge>');
  expect(source).toContain('<StatusBadge tone="warning">Ignored</StatusBadge>');
  expect(source).toContain('header:"Why"');
  expect(source).toContain("No stored rules or fallback steps were found for this module.");
 });
 it("UX-admin-projects-project-id-04 /admin/projects/[projectId] remains a canonical redirect with stable encoding",()=>{
  const source=page("/admin/projects/[projectId]");
  expect(source).toContain('import { redirect }');
  expect(source).toContain("encodeURIComponent(projectId)");
  expect(source).toContain('"/summary"');
  expect(source).not.toContain("<main");
 });
 it("UX-admin-projects-templates-template-id-overview-04 /admin/projects/templates/[templateId]/overview validates before redirect",()=>{
  const source=page("/admin/projects/templates/[templateId]/overview");
  expect(source).toContain('requirePermission(context,"project-template.read")');
  expect(source).toContain("projectTemplateIdSchema.safeParse");
  expect(source).toContain("if(!result.success)notFound()");
  expect(source).toContain('redirect(templateSubviewHref(result.data,"overview"))');
 });
 it("UX-admin-recruiters-04 /admin/recruiters retains the scoped Super Admin HR editor without a duplicate permission surface",()=>{
  const source=page("/admin/recruiters");
  expect(source).toContain('export { default } from "../hr/page"');
  expect(source).not.toContain("<main");
 });
 it("UX-admin-route-coverage-04 every /admin last-third route has a named source contract and route path",()=>{
  const list=read("docs/orchestrator/ui-ux/pages-admin.md");
  const routes=[...list.matchAll(/^- \[[ x]\] `(\/admin[^\`]+)` \((src\/app\/.*\/page\.tsx)\)$/gm)].map(x=>({route:x[1],path:x[2]})).slice(74,111);
  expect(routes).toHaveLength(37);
  const suites=[
    "tests/unit/ux-admin-chat9-batch-01.test.ts",
    "tests/unit/ux-admin-chat9-batch-02.test.ts",
    "tests/unit/ux-admin-chat9-batch-03.test.ts",
    "tests/unit/ux-admin-chat9-batch-04.test.ts",
  ].map(read).join("\n");
  for(const {route,path} of routes){
    expect(read(path)).toBeTruthy();
    const slug=route.replace(/^\/admin\//,"").replace(/\[([^\]]+)\]/g,(_,name:string)=>name.replace(/[A-Z]/g,(letter:string)=>"-"+letter.toLowerCase())).replace(/\//g,"-");
    expect(suites,route).toContain("UX-admin-"+slug+"-01");
    expect(suites,route).toContain(path);
  }
 });
});
