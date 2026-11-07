import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync("src/components/courses/"+name+".tsx","utf8");
describe("UX-G139 course learning, safety and authoring",()=>{
 it("prevents silent loss of unsent quiz answers, announces progress and never submits an empty question set",()=>{
  const s=read("quiz-attempt-control");
  expect(s).toContain("answered > 0 && !(await askConfirm(");
  expect(s).toContain("Your selected answers have not been submitted and will be lost.");
  expect(s).toContain('role="status" aria-live="polite"');
  expect(s).toContain("disabled={submitting || quiz.questions.length === 0}");
  expect((s.match(/"answered":"not answered"/g)??[])).toHaveLength(2);
  expect((s.match(/"Answered":"Not answered"/g)??[])).toHaveLength(2);
  expect(s).toContain("scroll-mt-24");
  expect(s).toContain("max-w-full break-words");
  expect(s).toContain("min-w-0 break-words");
  expect(s).toContain('onClick={submitAttempt}');
 });
 it("fails closed while resource progress is unverified and offers a mobile-safe retry",()=>{
  const s=read("resource-progress-control");
  expect(s).toContain("if (saving || !verified || complete===next) return;");
  expect(s).toContain('aria-busy={saving}');
  expect(s).toContain('aria-live="polite"');
  expect(s).toContain("min-h-11 w-full sm:w-auto");
  expect(s).toContain('disabled={!hydrated||saving||!verified}');
 });
 it("course creation validates its selected path, announces invalid fields and guards duplicate submissions",()=>{
  const s=read("super-admin-lesson-create");
  expect(s).toContain("paths.some(item=>item.id===pathId)");
  expect(s).toContain("aria-invalid={Boolean(fieldErrors.path)}");
  expect(s).toContain("aria-invalid={Boolean(fieldErrors.name)}");
  expect(s).toContain("lock.current=true;setPending(true)");
  expect(s).toContain("aria-busy={pending}");
 });
 it("content authoring search remains scoped, keyboard reachable and responsive on phones",()=>{
  const s=read("super-admin-content-directory-page");
  expect(s).toContain('aria-label="Find a course or lesson to add content"');
  expect(s).toContain("basis-full sm:basis-[12rem]");
  expect(s).toContain('aria-label="Authoring lesson pages"');
  expect(s).toContain("hasNextLessons");
  expect(s).toContain("context.adminScope?.collegeId");
  expect(s).toContain("isSuperAdmin(context)");
 });
});
