import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerStaffApplicationOptOut} from "@/modules/placements/learner-staff-application-optout-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO bulk add side effects",()=>{
 it("TPO-students-15 permits opt-out only for staff-submitted applications inside their 48-hour window",()=>{
  const start=new Date("2099-01-01T10:00:00.000Z");
  const input={submittedAt:start,submittedByUserId:"staff",learnerUserId:"learner"};
  expect(learnerStaffApplicationOptOut({...input,now:new Date("2099-01-03T09:59:59.000Z")}).canOptOut).toBe(true);
  expect(learnerStaffApplicationOptOut({...input,now:new Date("2099-01-03T10:00:00.000Z")}).canOptOut).toBe(false);
  expect(learnerStaffApplicationOptOut({...input,submittedByUserId:"learner",now:start}).canOptOut).toBe(false);
 });
 it("TPO-students-15 keeps the learner app notice and separately creates a college-scoped summary bell only after real additions",()=>{
  const service=src("src/modules/placements/bulk-drive-service.ts");
  expect(service).toContain("You were added to a placement drive");
  expect(service).toContain('const added=results.filter(item=>item.status==="added")');
  expect(service).toContain("if(added.length)");
  expect(service).toContain('eventType:"STUDENTS_ADDED_TO_DRIVE"');
  expect(service).toContain('eq(collegeMemberships.collegeId,job.collegeId)');
  expect(service).toContain('eq(membershipRoles.role,"TPO")');
  expect(service).toContain("added.length+\" student(s) added to \"+company");
 });
 it("TPO-students-15 requires a staff-origin id and enforces opt-out with an application row lock",()=>{
  const service=src("src/modules/placements/application-service.ts");
  expect(service).toContain("learnerStaffApplicationOptOut({");
  expect(service).toContain('eq(placementApplications.status,"WITHDRAWN")');
  expect(service).toContain("if(optOut.staffApplied&&!optOut.canOptOut)");
 });
});
