import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const read=(file:string)=>readFileSync(resolve(process.cwd(),file),"utf8");
describe("Mentor-only learner academic facts boundaries",()=>{
 const academic=read("src/modules/projects/mentor-learner-academic-facts-service.ts");
 const workspace=read("src/modules/projects/workspace-view-service.ts");
 const ui=read("src/components/projects/mentor-prototype-project-summaries.tsx");
 it("requires a current Mentor workspace read and denies observer/learner readers",()=>{
  expect(academic).toContain("await requireProjectReadAccess(context,projectIdInput)");
  expect(academic).toContain('scope.access!=="MENTOR"');
  expect(workspace).toContain('mentorLearnerAcademicFacts=access.access==="MENTOR"');
 });
 it("links only active learner members in the current college and project",()=>{
  expect(academic).toContain("eq(projectMembers.projectId,scope.project.id)");
  expect(academic).toContain('eq(projectMembers.role,"LEARNER")');
  expect(academic).toContain("isNull(projectMembers.endedAt)");
  expect(academic).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
  expect(academic).toContain('eq(learnerProgramEnrollments.status,"ACTIVE")');
  expect(academic).toContain("eq(departments.collegeId,scope.collegeId)");
 });
 it("does not add student demographics to the default cross-role project member API",()=>{
  const service=read("src/modules/projects/member-service.ts");
  const fn=service.slice(service.indexOf("export async function listProjectMembers("),
    service.indexOf("export async function listMyLearnerProjectPage("));
  expect(fn).not.toContain("learnerProfiles");
  expect(fn).not.toContain("registrationNumber");
 });
 it("labels absent programme, missing lead and online status as unavailable",()=>{
  expect(ui).toContain("Discipline not recorded");
  expect(ui).toContain("no\n      student lead is inferred");
  expect(ui).toContain("academic year\n      is shown only when it is recorded");
  expect(academic).toContain("academicYear:cohorts.academicYear");
  expect(academic).toContain("academicYear:row.departmentName?row.academicYear:null");
  expect(ui).toContain("Last recorded action comes from persisted project events");
 });
});
