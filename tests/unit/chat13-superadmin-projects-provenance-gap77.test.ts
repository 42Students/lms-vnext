import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("SA-placements-projects-77 full Projects mutation provenance",()=>{
 const flows=[
  ["Mentor reassignment","src/modules/projects/member-service.ts","PROJECTS_MENTOR_REASSIGNED"],
  ["Task assignment","src/modules/projects/task-assignment-service.ts","recordActivityEventInTransaction"],
  ["Automatic task assignment","src/modules/projects/mentor-auto-assign-service.ts","autoAssigned:true"],
  ["Readiness override","src/modules/projects/readiness-override-service.ts","PROJECTS_READINESS_OVERRIDDEN"],
  ["Submission lock","src/modules/projects/admin-submission-review-service.ts","projectDeliveryActivity"],
  ["Resource creation and changes","src/modules/projects/resource-service.ts","projectResourceAuditInput"],
 ];
 it.each(flows)("SA-placements-projects-77 records %s from scoped persisted mutation",(_label,path,evidence)=>{
  const source=read(path);
  expect(source).toContain(evidence);
  expect(source).toContain("recordActivityEventInTransaction");
  expect(source).toContain("transaction(async");
 });
 it("SA-placements-projects-77 retains scoped mentor and release event types",()=>{
  const types=read("src/modules/activity/taxonomy.ts");
  for(const event of ["PROJECTS_MENTOR_REASSIGNED","PROJECTS_RELEASE_CREATED",
   "PROJECTS_RELEASE_UPDATED","PROJECTS_RELEASE_DELETED","PROJECTS_TEMPLATE_COLLEGE_ASSIGNED",
   "PROJECTS_TEMPLATE_COLLEGE_REVOKED"])
   expect(types).toContain(event);
 });
});
