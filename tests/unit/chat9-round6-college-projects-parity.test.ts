import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("College Admin Projects round 6",()=>{
 it("COL-projects-16 provides template search section counts details and a scoped CSV export",()=>{
  const s=source("src/app/(authenticated)/college/projects/templates/page.tsx");
  for(const text of ["visible.map","Search templates","Section","ProjectTemplateCatalogueExport","projectTemplateSectionCounts","View template"])expect(s).toContain(text);
  expect(source("src/modules/projects/project-template-catalogue-model.ts")).toContain("projectTemplateCatalogueCsv");
 });
 it("COL-projects-19 displays the exact Workspaces, Templates, Submission and Audit headings plus the legacy risk description",()=>{
  expect(source("src/app/(authenticated)/college/projects/page.tsx")).toContain('title="Project workspaces"');
  expect(source("src/app/(authenticated)/college/projects/templates/page.tsx")).toContain('title="Project templates"');
  expect(source("src/components/projects/project-admin-submissions-page.tsx")).toContain('title="Submissions dashboard"');
  expect(source("src/components/projects/project-admin-at-risk-page.tsx")).toContain("Workspaces with no recent activity, an active blocker, or a pending review.");
  expect(source("src/components/projects/project-admin-audit-page.tsx")).toContain("Who changed what, and when — check daily for anything unexpected.");
 });
 it("COL-projects-20 renders a recovery alert on all College Projects entry routes when college context is absent",()=>{
  for(const suffix of ["readiness/page.tsx","at-risk/page.tsx","submissions/page.tsx","templates/page.tsx","templates/[templateId]/page.tsx","audit/page.tsx"]){
   const s=source("src/app/(authenticated)/college/projects/"+suffix);
   expect(s).toContain("ProjectAdminMissingCollege");
  }
  expect(source("src/components/projects/project-admin-missing-college.tsx")).toContain("Pick a college in the header");
 });
 it("COL-projects-22 is NOT-A-GAP: mentor class and template filters were absent in the old Workspaces list",()=>{
  const filters=source("src/components/projects/project-admin-collection-controls.tsx");
  expect(filters).toContain("Workspace status");
  expect(filters).toContain('name={legacyWorkspaces ? "search" : "q"}');
  expect(filters).not.toContain('name="templateId"');
 });
});
