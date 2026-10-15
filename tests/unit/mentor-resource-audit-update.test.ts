import {expect,it} from "vitest";
import {projectResourceAuditInput} from "@/modules/projects/mentor-resource-audit-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
it("keeps update resource audit inside the project transaction with safe metadata",()=>{
 const input=projectResourceAuditInput("UPDATED",{
  projectId:"project-a",collegeId:"college-a",organizationId:"org-a",
 },{id:"resource-a",title:"Reference =unsafe"},nonce-a);
 expect(input.eventType).toBe(ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED);
 expect(input).toMatchObject({collegeId:"college-a",organizationId:"org-a",
  metadata:{projectId:"project-a",resourceId:"resource-a"},
  subjectType:"project_resource",subjectId:"resource-a"});
 expect(input.dedupeKey).toContain("resource-a:updated");
 expect(JSON.stringify(input.metadata)).not.toContain("Reference");
 expect(JSON.stringify(input.metadata)).not.toContain("url");
});
