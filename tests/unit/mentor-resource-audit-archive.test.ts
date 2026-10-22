import {expect,it} from "vitest";
import {projectResourceAuditInput} from "@/modules/projects/mentor-resource-audit-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
it("keeps archive resource audit inside the project transaction with safe metadata",()=>{
 const input=projectResourceAuditInput("ARCHIVED",{
  projectId:"project-a",collegeId:"college-a",organizationId:"org-a",
 },{id:"resource-a",title:"Reference =unsafe"},);
 expect(input.eventType).toBe(ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED);
 expect(input).toMatchObject({collegeId:"college-a",organizationId:"org-a",
  metadata:{projectId:"project-a",resourceId:"resource-a"},
  subjectType:"project_resource",subjectId:"resource-a"});
 expect(input.dedupeKey).toContain("resource-a:archived");
 expect(input.metadata).toMatchObject({resourceKey:"resource-a",actionType:"DELETE"});
 // Audit JSON preserves the literal resource title for forensic accuracy; this
 // is not a spreadsheet cell, so equals signs inside a title are not formulas.
 expect(input.metadata.afterJson).toMatchObject({title:"Reference =unsafe",url:null});
 const privateInput=projectResourceAuditInput("ARCHIVED",{
  projectId:"project-a",collegeId:"college-a",organizationId:"org-a",
 },{id:"resource-b",title:"Private https://storage.example/secret"},undefined,undefined,{
  after:{title:"Private https://storage.example/secret",url:"https://storage.example/secret",
   description:"internal notes",accessNotes:"do not disclose"},
 });
 const privateMetadata=JSON.stringify(privateInput.metadata);
 expect(privateMetadata).not.toContain("https://storage.example/secret");
 expect(privateMetadata).not.toContain("internal notes");
 expect(privateMetadata).not.toContain("do not disclose");
 expect(privateInput.metadata.afterJson).toMatchObject({url:"[redacted private resource URL]",
  description:"[redacted resource description]",accessNotes:"[redacted access notes]"});
});
