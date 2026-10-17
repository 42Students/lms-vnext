import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const template=source("src/modules/projects/template-service.ts");
const page=source("src/components/projects/project-admin-audit-page.tsx");
describe("SA-placements-projects-77 project template audit integrity",()=>{
 it.each([
  ["CREATED","created"],["REVISED","revised"],["PUBLISHED","published"],
  ["UNPUBLISHED","unpublished"],["DUPLICATED","duplicated"],["ARCHIVED","archived"],
  ["ASSIGNED","assigned"],["UNASSIGNED","unassigned"],
 ] as const)("SA-placements-projects-77 registers template %s events", (name,suffix)=>{
  const key="PROJECTS_TEMPLATE_"+name;
  const event=ACTIVITY_EVENT_TYPES[key];
  expect(event).toBe("projects.template."+suffix);
  expect(template).toContain("ACTIVITY_EVENT_TYPES."+key);
 });
 it("SA-placements-projects-77 records create revise publish unpublish and duplicate in the same transaction",()=>{
  for(const snippet of ["Super Admin created project template","Super Admin revised project template",
    "Super Admin published project template","Super Admin unpublished project template",
    "Super Admin duplicated project template"]){
   expect(template).toContain(snippet);
  }
  expect((template.match(/recordActivityEventInTransaction\(tx,context/g)||[]).length).toBeGreaterThanOrEqual(8);
 });
 it("SA-placements-projects-77 archives after locking template and prevents active assignment archival",()=>{
  const archive=template.slice(template.indexOf("export async function archiveProjectTemplate("),
   template.indexOf("export async function assignProjectTemplateToCollege("));
  expect(archive).toContain('.for("update")');
  expect(archive).toContain("PROJECT_TEMPLATE_HAS_ACTIVE_ASSIGNMENTS");
  expect(archive).toContain("PROJECTS_TEMPLATE_ARCHIVED");
 });
 it("SA-placements-projects-77 audit scope is tenant-specific for assignments and global for templates",()=>{
  expect(template).toContain("organizationId:college.organizationId,collegeId:college.id");
  expect(page).toContain("globalTemplateAudit");
  expect(page).toContain("Platform-wide Projects activity includes global template changes.");
  expect(page).toContain('module: "PROJECTS"');
  expect(page).toContain("listActivityEvents(");
 });
});
