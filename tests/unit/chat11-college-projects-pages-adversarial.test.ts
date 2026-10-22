import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const base="src/app/(authenticated)/college/projects/";
const pages=[
 "page.tsx","create/page.tsx","templates/page.tsx",
 "templates/[templateId]/page.tsx","audit/page.tsx",
 "reassign-mentor/page.tsx","workspaces/new/page.tsx",
] as const;

describe("PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries",()=>{
 for(const page of pages){
  it(`PROJ-BREAK-COL-PAGES-01 /${page} refuses unselected/wrong-college navigation`,()=>{
   const source=readFileSync(base+page,"utf8");
   if(page==="workspaces/new/page.tsx"){
    expect(source).toContain('redirect("/college/projects/create?mode=teams")');
    return;
   }
   const scope=source.indexOf("getProjectAdminCollegeId(context)");
   expect(source,page).toContain("getCurrentRequestContext()");
   expect(scope,page).toBeGreaterThan(0);
   expect(source,page).not.toContain("context.membership.collegeId");
   expect(source,page).not.toContain("context.membership?.collegeId");
   expect(source,page).not.toContain('redirect("/dashboard")');
   expect(source,page).toMatch(/if\s*\(!collegeId\)|if\s*\(!getProjectAdminCollegeId\(context\)\)/);
  });
 }
 it("keeps malformed URL filters recoverable without loading projects",()=>{
  const source=readFileSync(base+"page.tsx","utf8");
  expect(source).toContain("parseCollegeProjectsQuery(await searchParams)");
  expect(source).toContain('title="Invalid project filters"');
  const invalid=source.indexOf("if (!parsed.success)");
  const list=source.indexOf("listProjectAdminSnapshots(context, collegeId, serviceQuery)");
  expect(invalid).toBeGreaterThan(0);
  expect(invalid).toBeLessThan(list);
  expect(source).toContain('href="/college/projects"');
 });
 it("missing optional template labels must not hide actual project workspaces",()=>{
  const source=readFileSync(base+"page.tsx","utf8");
  expect(source).toContain("listProjectAdminSnapshots(context, collegeId, serviceQuery)");
  expect(source).toContain("listAssignedProjectTemplates(context, collegeId)");
  expect(source).toContain('.catch(() => ({ ok: false as const }))');
  expect(source).toContain("const templateTitles = new Map(");
  expect(source).toContain("templatesResult.ok ? templatesResult.value : []");
  expect(source).toContain("<ProjectAdminWorkspaceList");
  expect(source).toContain('emptyTitle={query.q||query.status?"No workspaces match your search/filter":"No workspaces available for this college"}');
  expect(source).toContain("<ProjectAdminPagination");
 });
 it("does not produce a class team when authority or published templates are unavailable",()=>{
  const alias=readFileSync(base+"workspaces/new/page.tsx","utf8");
  expect(alias).toContain('redirect("/college/projects/create?mode=teams")');
  const source=readFileSync(base+"create/page.tsx","utf8");
  expect(source).toContain('if(mode!=="single")await requireTeamCreationAuthority(context,collegeId)');
  expect(source).toContain("templates.length===0?");
  expect(source).toContain("No published Project template is assigned to this college.");
  expect(source).toContain('href="/college/projects"');
  expect(source).toContain("No published Project template is assigned to this college.");
  expect(source).toContain("ClassTeamWorkspaceCreator");
  expect(source).toContain('aria-label="Workspace creation modes"');
 });
 it("template detail and mentor reassignment use selected-college identities instead of URL overrides",()=>{
  const detail=readFileSync(base+"templates/[templateId]/page.tsx","utf8");
  expect(detail).toContain("getAssignedProjectTemplateDetail(");
  expect(detail).toContain("context,");
  expect(detail).toContain("collegeId,");
  const reassign=readFileSync(base+"reassign-mentor/page.tsx","utf8");
  expect(reassign).toContain("collegeId={collegeId}");
  expect(reassign).toContain('basePath="/college/projects"');
 });
});
