import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/components/courses/learner-assessment-overview.tsx",import.meta.url),"utf8");

describe("UX-courses-learner-quiz-table-01 /learn/allQuizzes",()=>{
 it("renders one shared DataTable with quiz-only rows, mobile priorities and explicit empty text",()=>{
  expect(source).toContain('caption="Quiz list"');
  expect(source).toContain("<DataTable");
  expect(source).toContain('item is LearnerQuizOverviewItem');
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).toContain('mobilePriority:"secondary"');
  expect(source).toContain('mobilePriority:"action"');
  expect(source).toContain('No quizzes found');
  expect(source).not.toContain("<table");
  expect(source).not.toContain("space-y-3 lg:hidden");
 });
 it("retains published-results privacy, independent attempt history and deadline-safe quiz actions",()=>{
  expect(source).toContain("quizOverviewActionState(item,currentNowMs)");
  expect(source).toContain("learnerQuizMobileState(item,currentNowMs).detail");
  expect(source).toContain('item.resultsPublished?"View result":"Not released"');
  expect(source).toContain('state.review?"&review=true":""');
  expect(source).toContain("Attempt history");
  expect(source).toContain('min-h-11');
 });
 it("keeps assignment cards and submission drawer separate from quiz table",()=>{
  expect(source).toContain('kind==="ASSIGNMENT" ? (');
  expect(source).toContain('aria-label="Assignment list"');
  expect(source).toContain("setSelectedAssignmentKey");
  expect(source).toContain("<Drawer");
  expect(source).toContain("AssignmentSubmissionControl");
 });
});
