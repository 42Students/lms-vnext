import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { projectResourceAuditAction, projectResourceAuditMatches } from "../../src/modules/projects/project-resource-audit-model";
const file=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("College workspace resource activity",()=>{
 it("COL-projects-18 recognizes resource added edited saved removed without treating task events as resource edits",()=>{
  expect(projectResourceAuditAction("projects.resource.created")).toBe("Added");
  expect(projectResourceAuditAction("projects.resource.updated")).toBe("Edited");
  expect(projectResourceAuditAction("projects.resource.saved")).toBe("Saved");
  expect(projectResourceAuditAction("projects.resource.archived")).toBe("Removed");
  expect(projectResourceAuditAction("projects.task.updated")).toBeNull();
  expect(projectResourceAuditMatches("projects.task.created","RESOURCES")).toBe(false);
  expect(projectResourceAuditMatches("projects.resource.archived","Removed")).toBe(true);
  const activity=file("src/components/projects/project-activity-filtered-list.tsx");
  for(const token of ["Search activity","Resource change","All resource changes","Clear filters","projectResourceAuditMatches"])
   expect(activity).toContain(token);
 });
});
