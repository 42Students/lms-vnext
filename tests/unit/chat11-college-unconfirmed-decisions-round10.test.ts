import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {collegeCompaniesHref,parseCollegeCompaniesQuery} from "@/modules/placements/college-company-directory-model";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("chat-11 delegated College Admin decisions",()=>{
 it("COL-academic-setup-41 supports long cards and keyboard-scrollable tables at 375px",()=>{
  const cards=src("src/components/admin/college-dashboard-cards.tsx");
  const forms=src("src/components/academics/college-academic-directory.tsx");
  expect(cards).toContain("break-words");
  expect(forms).toContain("grid grid-cols-1 gap-3 sm:grid-cols-2");
  expect(forms).toContain("overflow-x-auto");
 });
 it("COL-course-tabs-15 restores archived lessons without erasing progress or bypassing permission",()=>{
  const svc=src("src/modules/courses/lesson-service.ts");
  const route=src("src/app/api/courses/lessons/[lessonId]/restore/route.ts");
  const list=src("src/components/courses/college-learning-directory.tsx");
  expect(svc).toContain("export async function restoreCourseLesson");
  expect(svc).toContain("loadCourseLessonScope(lessonId, true)");
  expect(svc).toContain('eq(courseLessons.status, "ARCHIVED")');
  expect(svc).toContain('requirePermission(context, "courses.manage"');
  expect(svc).toContain("lockLiveLessonWriteAncestry(tx, path)");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("export async function POST");
  expect(list).toContain('item.status==="ARCHIVED"');
  expect(list).toContain("<CollegeArchivedLessonRestore");
  const restore=src("src/components/courses/college-archived-lesson-restore.tsx");
  expect(restore).toContain("Historical progress and submissions are kept.");
 });
 it("COL-course-tabs-23 uses bounded route Retry and avoids showing stale progress as current",()=>{
  for(const segment of ["lessons","assignments","quizzes","course-progress"]){
   const code=src("src/app/(authenticated)/college/"+segment+"/error.tsx");
   expect(code).toContain("Retry");
   expect(code).toContain("reset");
   expect(code).not.toContain("error.message");
  }
 });
 it("COL-course-tabs-25 keeps watched threshold platform-wide and hidden from college editors",()=>{
  expect(src("docs/audit/owner-decisions-resolved.md")).toContain("OD-34 | Watched threshold platform-wide, hidden");
  expect(src("src/modules/courses/progress-service.ts")).toContain("TIMED_CONTENT_COMPLETION_THRESHOLD_PERCENT = 90");
  expect(src("src/components/academics/college-semester-management.tsx")).not.toContain("watchedThresholdPercent");
 });
 it("COL-dashboard-17 exposes 375px-safe cards and a single-column first checklist",()=>{
  const cards=src("src/components/admin/college-dashboard-cards.tsx");
  const checklist=src("src/components/admin/college-setup-checklist.tsx");
  expect(cards).toContain("min-[375px]:grid-cols-2");
  expect(cards).toContain("min-w-0 break-words");
  expect(checklist).toContain("grid min-w-0 gap-4 md:grid-cols-2");
 });
 it("COL-people-12 does not add unsafe permanent OTP account unlock for five-minute challenges",()=>{
  const login=src("src/modules/auth/login-service.ts");
  expect(login).toContain("ATTEMPT_LIFETIME_SECONDS = 300");
  expect(login).toContain("OTP_ATTEMPTS_EXCEEDED");
  expect(login).not.toContain("clearUserLockout");
 });
 it("COL-people-20 requires Super Admin for granting or revoking the college admin role",()=>{
  const svc=src("src/modules/people/membership-service.ts");
  for(const method of ["addMembershipRole","removeMembershipRole"]){
   const part=svc.slice(svc.indexOf("export async function "+method));
   expect(part).toContain('if (input.role === "COLLEGE_ADMIN")');
   expect(part).toContain('requirePermission(context, "admin-scope.select")');
  }
 });
 it("COL-placements-03 does not misrepresent TPO-only offer-letter tools as College Admin authoring",()=>{
  const workspace=src("src/components/placements/placement-drive-workspace.tsx");
  expect(workspace).toContain('hasMembershipRole(context, "TPO")');
  expect(workspace).toContain('Offer letter evidence');
  expect(workspace).toContain('<PlacementOfferControls');
 });
 it("COL-placements-15 lists archived companies and restores only a selected college relationship",()=>{
  const parsed=parseCollegeCompaniesQuery({status:"ARCHIVED",page:"2"});
  expect(parsed.success).toBe(true);
  if(!parsed.success)return;
  expect(collegeCompaniesHref(parsed.data)).toContain("status=ARCHIVED");
  expect(parseCollegeCompaniesQuery({status:"DELETED"}).success).toBe(false);
  const service=src("src/modules/placements/company-service.ts");
  const directory=src("src/modules/placements/college-company-directory-service.ts");
  const restore=src("src/app/api/placements/companies/[relationshipId]/restore/route.ts");
  const ui=src("src/components/placements/placement-employer-relationships.tsx");
  expect(service).toContain("export async function restorePlacementCompanyRelationship");
  expect(service).toContain('eq(placementCompanyRelationships.collegeId,current.relationship.collegeId)');
  expect(service).toContain('eq(placementCompanyRelationships.status,"ARCHIVED")');
  expect(service).toContain('current.company.status!=="ACTIVE"');
  expect(directory).toContain("query.status");
  expect(restore).toContain("isSameOriginRequest(request)");
  expect(ui).toContain('title="Restore this company?"');
 });
});
