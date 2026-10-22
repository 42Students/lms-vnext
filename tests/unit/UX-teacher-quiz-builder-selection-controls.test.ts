import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/courses/faculty-choice-quiz-builder.tsx"),"utf8");
describe("Quiz builder checkbox semantics",()=>{
 it("UX-teacher-courses-deliveryId-quizzes-manage-10 uses signed-off Checkbox controls with all existing labels",()=>{
  const s=source();
  for(const label of ["Shuffle question order per learner","Shuffle answer options per learner","Show answer key to faculty","Show only questions needing correction","Correct","Publish now"])expect(s).toContain('<Checkbox label="'+label+'"');
  expect(s).toContain('question.type === "SINGLE_CHOICE" ? <Radio');
  expect(s).toContain(': <NativeCheckbox');
  expect(s).toContain('name={"preview-question-"+index} disabled');
  expect(s).toContain("facultyToggleQuizAnswer");
  expect(s).not.toContain('<input type="checkbox" checked=');
 });
});
