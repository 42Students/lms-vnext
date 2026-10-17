import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
describe("Chat-15 learner quizzes table parity",()=>{
 it("LEARNER-learning-misc-16 presents the seven legacy quiz table columns and honest grade disclosure",()=>{
  const text=readFileSync(join(process.cwd(),"src/components/courses/learner-assessment-overview.tsx"),"utf8");
  for(const heading of ["Overview","Course","Lesson","Due Date","Status","Grade","Actions"])expect(text).toContain(heading);
  expect(text).toContain('item.resultsPublished?"View result":"Not released"');
  expect(text).toContain('kind==="QUIZ"?"space-y-3 lg:hidden"');
  expect(text).toContain("min-w-[790px]");
 });
});