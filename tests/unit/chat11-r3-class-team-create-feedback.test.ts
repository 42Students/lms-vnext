import {expect,it} from "vitest";
import {classTeamCreationFeedback} from "@/modules/projects/class-team-create-feedback-model";
it("turns stale roster and preview failures into actionable retry guidance",()=>{
 expect(classTeamCreationFeedback(new Error("PROJECT_CLASS_ROSTER_STALE"))).toMatch(/Refresh the roster/);
 expect(classTeamCreationFeedback(new Error("Project Team Preview Stale"))).toMatch(/Review the team assignments/);
});
it("does not reveal private API exceptions or SQL errors",()=>{
 const copy=classTeamCreationFeedback(new Error("SQL failed at private.memberships/tenant-secret"));
 expect(copy).not.toMatch(/private|tenant-secret|SQL/);
});
it("makes permission denial and duplicate assignment explicit but non-leaking",()=>{
 expect(classTeamCreationFeedback(new Error("PROJECT_ACCESS_DENIED"))).toMatch(/permission/);
 expect(classTeamCreationFeedback(new Error("PROJECT_TEAM_PREVIEW_INVALID"))).toMatch(/exactly one/);
});
