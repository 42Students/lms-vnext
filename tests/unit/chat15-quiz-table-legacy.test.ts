import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
describe("Chat-15 learner quizzes responsive legacy content parity",()=>{
 it("LEARNER-learning-misc-16 preserves quiz title, course, lesson, due, state, grade and actions without claiming an unreleased score",()=>{
  const text=readFileSync(join(process.cwd(),
   "src/components/courses/learner-assessment-overview.tsx"),"utf8");
  expect(text).toContain('aria-label="Quiz list"');
  expect(text).toContain('item.courseName} · {item.lessonName}');
  expect(text).toContain('item.dueAt?"Due: "+formatDate(item.dueAt):"Due: -"');
  expect(text).toContain("<StatusBadge tone={state.tone}>");
  expect(text).toContain('!item.resultsPublished?"Not released"');
  expect(text).toContain('latestScore==="number"');
  expect(text).toContain("<dt className=\"text-muted-foreground\">Grade</dt>");
  expect(text).toContain("state.action");
  expect(text).toContain('sm:flex-row sm:items-start');
  expect(text).toContain('aria-label={"View quiz "+');
 });
});
