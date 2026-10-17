import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
const main=source("src/modules/projects/template-service.ts");
const rollback=source("src/modules/projects/template-rollback-service.ts");
const taxonomy=source("src/modules/activity/taxonomy.ts");
function body(name:string){
 const start=main.indexOf("export async function "+name+"(");
 const next=main.indexOf("export async function ",start+20);
 return main.slice(start,next<0?undefined:next);
}
describe("SA-placements-projects-77 persisted template mutation coverage",()=>{
 const lifecycle=[
  ["createProjectTemplate","PROJECTS_TEMPLATE_CREATED"],
  ["reviseProjectTemplate","PROJECTS_TEMPLATE_REVISED"],
  ["publishProjectTemplate","PROJECTS_TEMPLATE_PUBLISHED"],
  ["unpublishProjectTemplate","PROJECTS_TEMPLATE_UNPUBLISHED"],
  ["duplicateProjectTemplate","PROJECTS_TEMPLATE_DUPLICATED"],
  ["archiveProjectTemplate","PROJECTS_TEMPLATE_ARCHIVED"],
  ["assignProjectTemplateToCollege","PROJECTS_TEMPLATE_COLLEGE_ASSIGNED"],
  ["revokeProjectTemplateFromCollege","PROJECTS_TEMPLATE_COLLEGE_REVOKED"],
 ] as const;
 it.each(lifecycle)("SA-placements-projects-77 audits %s with %s inside its committed transaction",(fn,event)=>{
  const code=body(fn);
  expect(code).toContain("transaction(async");
  expect(code).toContain("recordActivityEventInTransaction(tx,context");
  expect(code).toContain("ACTIVITY_EVENT_TYPES."+event);
  expect(taxonomy).toContain(event+":");
 });
 it("SA-placements-projects-77 audits rollback as a distinct version-preserving action",()=>{
  expect(rollback).toContain("ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_ROLLED_BACK");
  expect(rollback).toContain("recordActivityEventInTransaction(tx,context");
  expect(rollback).toContain("existingWorkspacesUnchanged:true");
  expect(rollback).toContain("restoredFromVersion:prior.version");
 });
 it("SA-placements-projects-77 logs assignment scope and retains the publisher and archive lock",()=>{
  const assign=body("assignProjectTemplateToCollege");
  const archive=body("archiveProjectTemplate");
  expect(assign).toContain("collegeId:college.id");
  expect(assign).toContain('for("update")');
  expect(archive).toContain('for("update")');
  expect(assign).toContain("previousVersionId");
 });
});
