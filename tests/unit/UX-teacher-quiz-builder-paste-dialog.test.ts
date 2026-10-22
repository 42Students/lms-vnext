import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/courses/faculty-choice-quiz-builder.tsx"),"utf8");
describe("Quiz builder paste options and mobile touch UX",()=>{
 it("UX-teacher-courses-deliveryId-quizzes-manage-06 replaces blocking prompt with a keyboard-accessible shared Dialog",()=>{
  const s=source();
  expect(s).toContain('<Dialog open={pasteQuestionIndex!==null}');
  expect(s).toContain("facultyQuizApplyPastedOptions(current.options,pastedChoices)");
  expect(s).toContain("if(!result.ok){setError(result.issue);return;}");
  expect(s).toContain("<Textarea value={pastedChoices}");
  expect(s).toContain('title="Paste choices"');
  expect(s).not.toContain("window.prompt");
 });
 it("UX-teacher-courses-deliveryId-quizzes-manage-07 preserves correct edit limits and minimum tap size",()=>{
  const s=source();
  expect(s).toContain("facultyRemoveQuizOption");
  expect(s).toContain("q.options.length>=20");
  expect(s).toContain("min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border");
  expect(s).not.toContain("min-h-10");
  expect(s).not.toContain("text-on-primary");
 });
});
