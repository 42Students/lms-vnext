import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");

test("UX-G043/G066/G095 source inventory fully accounted for without deleting pages or safeguards",()=>{
 const board=JSON.parse(read("docs/tracker.json")).uxReview.groups;
 for(const id of ["UX-G043","UX-G066","UX-G095"]){
  const group=board.find(g=>g.id===id);
  assert.ok(group,id+" is in canonical tracker");
  assert.ok(group.sourceFiles.length>=12,id+" full scope retained");
  for(const path of group.sourceFiles)assert.ok(existsSync(path),id+" missing "+path);
 }
});
test("UX-G043 college student onboarding links and error recovery preserve role checks",()=>{
 const imported=read("src/app/(authenticated)/college/students/import/page.tsx");
 const single=read("src/app/(authenticated)/college/students/register/page.tsx");
 assert.match(imported,/hasMembershipRole\(context, "COLLEGE_ADMIN"\)/);
 assert.match(imported,/can\(context, "people.manage"/);
 assert.match(imported,/href="\/college\/students\/register"/);
 assert.match(single,/listCollegeStudentImportOptions\(context\)/);
 assert.match(single,/href="\/college\/students\/import"/);
 for(const slug of ["students/import","students/register","verification","videos"]){
  const e=read("src/app/(authenticated)/college/"+slug+"/error.tsx");
  assert.match(e,/onClick=\{reset\}/,slug+" retry");
  assert.match(e,/ButtonLink/,slug+" safe return");
  assert.match(e,/min-h-11/,slug+" accessible touch target");
 }
});
test("UX-G066 learner verification and project loading keep private status and bounded retry",()=>{
 const verify=read("src/app/(authenticated)/learn/profile/verification/page.tsx");
 const error=read("src/app/(authenticated)/learn/profile/verification/error.tsx");
 const projects=read("src/app/(authenticated)/learn/projects/error.tsx");
 const loading=read("src/app/(authenticated)/learn/projects/[projectId]/loading.tsx");
 const detail=read("src/app/(authenticated)/learn/projects/[projectId]/page.tsx");
 assert.match(verify,/getOwnLearnerVerificationStatus\(context\)/);
 assert.match(verify,/A saved detail does not mean it is verified/);
 assert.match(error,/href="\/learn\/profile"/);
 assert.match(projects,/href="\/learn\/home"/);
 assert.match(loading,/GracefulPageLoading/);
 assert.match(loading,/canonicalLearnerProjectTab/);
 assert.match(detail,/getCurrentRequestContext/);
 assert.match(read("src/app/(authenticated)/learn/quizzes/page.tsx"),/redirect\("\/learn\/allQuizzes"\)/);
});
test("UX-G095 faculty profile and student details keep membership scope and readable recovery",()=>{
 const profile=read("src/app/(authenticated)/teacher/profile/page.tsx");
 const student=read("src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx");
 const classes=read("src/app/(authenticated)/teacher/live-classes/page.tsx");
 assert.match(profile,/context\.membership\?\.status !== "ACTIVE"/);
 assert.match(profile,/roles\.includes\("FACULTY"\)/);
 assert.match(profile,/<progress/);
 assert.match(student,/getFacultyStudentDetail\(context, await params\)/);
 assert.match(student,/Number\.isFinite\(date\.getTime\(\)\)/);
 assert.match(classes,/href="\/teacher\/courses"/);
 for(const slug of ["profile","profile/contacts","notifications","live-classes"]){
  const e=read("src/app/(authenticated)/teacher/"+slug+"/error.tsx");
  assert.match(e,/onClick=\{reset\}/,slug+" retry");
  assert.match(e,/min-h-11/,slug+" accessible retry");
 }
});
