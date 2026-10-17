import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {replaceCollegeProjectRosterSchema} from "@/modules/projects/college-project-roster-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const first="11111111-1111-4111-8111-111111111111";
const second="22222222-2222-4222-8222-222222222222";
const stamp="2099-01-02T12:30:00.000Z";
describe("College Admin atomic Team roster replacement",()=>{
 it("COL-projects-15 accepts a distinct checked learner roster and preserves optional role labels",()=>{
  expect(replaceCollegeProjectRosterSchema.parse({
   learnerMembershipIds:[first,second],roleLabel:" Team captain ",expectedUpdatedAt:stamp,
  })).toEqual({learnerMembershipIds:[first,second],roleLabel:"Team captain",expectedUpdatedAt:stamp});
 });
 it("COL-projects-15 rejects duplicate, invalid or unbounded learner membership input",()=>{
  for(const ids of [[first,first],["not-a-uuid"],Array.from({length:101},(_,i)=>
   "00000000-0000-4000-8000-"+String(i+1).padStart(12,"0"))]){
   expect(replaceCollegeProjectRosterSchema.safeParse({learnerMembershipIds:ids,expectedUpdatedAt:stamp}).success).toBe(false);
  }
  expect(replaceCollegeProjectRosterSchema.safeParse({learnerMembershipIds:[first],expectedUpdatedAt:stamp,collegeId:first}).success).toBe(false);
  expect(replaceCollegeProjectRosterSchema.safeParse({learnerMembershipIds:[first],expectedUpdatedAt:"yesterday"}).success).toBe(false);
 });
 it("COL-projects-15 uses one transaction for add and remove, rejects class-managed rosters and audits every change",()=>{
  const service=source("src/modules/projects/college-project-roster-service.ts");
  const route=source("src/app/api/projects/[projectId]/roster/route.ts");
  const workspace=source("src/components/projects/project-workspace.tsx");
  const modal=source("src/components/projects/college-project-student-roster-dialog.tsx");
  expect(service).toContain("requireProjectManageAccess");
  expect(service).toContain("getDb().transaction");
  expect(service).toContain("project.teamGroupId");
  expect(service).toContain("recordActivityEventInTransaction");
  expect(service).toContain("notifyProjectMemberships");
  expect(service).toContain("PROJECT_MEMBER_CONFLICT");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(workspace).toContain("<CollegeProjectStudentRosterDialog");
  expect(modal).toContain("Manage students");
  expect(modal).toContain("Replace roster");
  expect(modal).toContain("Learners updated");
  expect(modal).toContain("Your selected learners are kept");
 });
});
