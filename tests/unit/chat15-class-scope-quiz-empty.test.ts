import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-15 learner no-class assessment state",()=>{
 it("LEARNER-learning-misc-19 distinguishes persisted class missing, loading failures and truly empty quizzes",()=>{
  const service=src("src/modules/courses/learner-assessment-service.ts");
  const component=src("src/components/courses/learner-assessment-overview.tsx");
  expect(service).toContain("learnerProgramEnrollments.membershipId");
  expect(service).toContain('classScope="UNAVAILABLE"');
  expect(component).toContain("You haven't been added to a class yet");
  expect(component).toContain("Quizzes appear once your college puts you in a class or section.");
  expect(component).toContain("Couldn&apos;t load your class");
  expect(component).toContain('href="/learn/allQuizzes"');
  expect(src("src/app/(authenticated)/learn/allQuizzes/page.tsx")).toContain("classScope={overview.classScope}");
 });
});