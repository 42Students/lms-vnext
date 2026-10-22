import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=()=>readFileSync(join(process.cwd(),"src/components/courses/faculty-choice-quiz-builder.tsx"),"utf8");
describe("Shared Quiz authoring controls",()=>{
 it("UX-teacher-courses-deliveryId-quizzes-manage-08 uses signed-off field and button components",()=>{
  const source=read();
  for(const component of ["Input","Select","Textarea","Button"])expect(source).toContain("<"+component);
  expect(source).not.toContain("<select ");
  expect(source).not.toContain("<textarea ");
  expect(source).not.toContain("<button ");
  expect(source).toContain('variant="primary" type="button" disabled={pending||!lessonId}');
 });
 it("UX-teacher-courses-deliveryId-quizzes-manage-09 keeps correct single/multiple-choice inputs and limits",()=>{
  const source=read();
  expect(source).toContain('question.type === "SINGLE_CHOICE" ? <Radio');
  expect(source).toContain('<NativeCheckbox');
  expect(source).toContain('name={"preview-question-"+index} disabled');
  expect(source).toContain("facultyToggleQuizAnswer");
  expect(source).toContain("maxLength={2000}");
  expect(source).toContain("max={20}");
  expect(source).toContain("facultyQuizQuestionIssue");
 });
});
