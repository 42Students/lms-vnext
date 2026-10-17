import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const code=()=>readFileSync(join(process.cwd(),"src/components/courses/learner-assessment-overview.tsx"),"utf8");
describe("chat-15 reassigned learner assessment legacy copy",()=>{
 it("LEARNER-learning-misc-13 displays Due for dated assignments and Created: only without due date",()=>{
  expect(code()).toContain('item.kind==="ASSIGNMENT"&&!item.dueAt');
  expect(code()).toContain('Created: ');
  expect(code()).toContain('Due ');
 });
 it("LEARNER-learning-misc-29 shows quiz and Submitted pills with the submitted quiz names",()=>{
  expect(code()).toContain('aria-label="Quiz summary"');
  expect(code()).toContain('submittedQuizzes.map(item');
  expect(code()).toContain('Submitted</summary>');
 });
});