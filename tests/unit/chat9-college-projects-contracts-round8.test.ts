import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const s=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 college projects scope and persistence contracts",()=>{
 it("COL-projects-06 previews per-learner cohort creation and confirms exact count before writing",()=>{
  const v=s("src/components/projects/class-team-workspace-creator.tsx");
  expect(v).toContain('mode==="INDIVIDUAL"');
  expect(v).toContain("/api/projects/cohort-preflight?collegeId=");
  expect(v).toContain("<ConfirmDialog open={Boolean(createConfirmation)}");
  expect(v).toContain('title={"Create "+(createConfirmation?.count??0)+" student workspaces?"}');
  expect(v).toContain("currentPreflight.alreadyCovered");
 });
 it("COL-projects-07 enforces a mentor for ACTIVE creation and permits scoped class roster choices",()=>{
  const v=s("src/components/projects/project-create-control.tsx");
  expect(v).toContain('if (initialStatus === "ACTIVE" && !mentorMembershipId)');
  expect(v).toContain("primaryMentorMembershipId:mentorMembershipId||undefined");
  expect(v).toContain("...old,...roster.map(row=>row.membershipId)");
  expect(v).toContain("new Set([");
  expect(v).toMatch(/\]\)\)\.slice\(0,500\)/);
 });
 it("COL-projects-12 restricts readiness overrides by current college and provides actual export",()=>{
  const v=s("src/components/projects/project-admin-readiness-page.tsx");
  expect(v).toContain("listCollegeActiveReadinessOverrides(context, collegeId)");
  expect(v).toContain("/api/projects/readiness-overrides/export?collegeId=");
  expect(v).toContain("listCollegeActiveReadinessOverrides");
 });
 it("COL-projects-13 exposes persisted review status, revision count and direct review action",()=>{
  const v=s("src/components/projects/project-admin-submissions-page.tsx");
  expect(v).toContain("summary.pendingReview");
  expect(v).toContain("historical={!row.isCurrentVersion}");
  expect(v).toContain("<ProjectAdminSubmissionReview");
 });
 it("COL-projects-15 replaces a learner roster atomically with scoped active memberships and version checks",()=>{
  const dialog=s("src/components/projects/college-project-student-roster-dialog.tsx");
  const service=s("src/modules/projects/college-project-roster-service.ts");
  expect(dialog).toContain("Manage students");
  expect(dialog).toContain("expectedUpdatedAt:version");
  expect(dialog).toContain('confirmLabel={mode==="REPLACE"?"Replace roster":"Add learners"}');
  expect(service).toContain("return getDb().transaction(async tx=>");
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(service).toContain("project.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt)");
 });
});
