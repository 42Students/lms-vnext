import {expect,it} from "vitest";
import {projectTeamAuditInput} from "@/modules/projects/mentor-team-audit-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
it("audits an authorized Project member add with opaque safe member fields",()=>{
 const event=projectTeamAuditInput("ADDED",{
  projectId:"project-uuid",collegeId:"college-uuid",organizationId:"org-uuid",
 },{id:"member-row-uuid",role:"MENTOR"},);
 expect(event.eventType).toBe(ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ADDED);
 expect(event.metadata).toEqual({projectId:"project-uuid",projectMemberId:"member-row-uuid",role:"MENTOR"});
 expect(event.subjectLabel).toBe("Project team membership");
 expect(JSON.stringify(event)).not.toContain("email");
 expect(JSON.stringify(event)).not.toContain("membershipId");
 expect(event.dedupeKey).toContain(":added");
});
