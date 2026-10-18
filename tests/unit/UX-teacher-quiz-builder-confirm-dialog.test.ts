import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/courses/faculty-choice-quiz-builder.tsx"),"utf8");
describe("Faculty quiz builder focus-managed confirmations",()=>{
 it("UX-teacher-courses-deliveryId-quizzes-manage-03 protects unsaved draft switching, resetting and copying",()=>{
  const s=source();
  for(const copy of ["Discard unsaved Quiz edits and switch to another Quiz?","Discard unsaved Quiz changes and restore the saved version?","Copy the current unsaved Quiz changes into a new draft?"])expect(s).toContain(copy);
  expect(s).toContain('copyToNewDraft(true)');
  expect(s).toContain("<ConfirmDialog");
  expect(s).not.toContain("window.confirm");
 });
 it("UX-teacher-courses-deliveryId-quizzes-manage-04 confirms removal and publication closure with original copy",()=>{
  const s=source();
  for(const contract of ["facultyQuizQuestionRemovalPrompt(i,q.prompt)","facultyQuizOptionRemovalPrompt(q.type,q.options,i,j)","Close this published Section Quiz?","Archive this Section Quiz?"])expect(s).toContain(contract);
  expect(s).toContain('submit(action,true)');
  expect(s).toContain('confirmVariant={confirmRequest?.variant??"danger"}');
 });
 it("UX-teacher-courses-deliveryId-quizzes-manage-05 preserves version locks and guarded reload",()=>{
  const s=source();
  expect(s).toContain("facultyQuizRetryNeedsConfirmation");
  expect(s).toContain("mutationInFlight.current");
  expect(s).toContain("onConfirm={acceptConfirm}");
 });
});
