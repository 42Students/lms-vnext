import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/components/courses/learner-assessment-overview.tsx",import.meta.url),"utf8");

describe("UX-courses-learner-quiz-table-01 /learn/allQuizzes",()=>{
 it("renders quiz-only legacy cards with explicit accessible empty and touch states",()=>{
  expect(source).toContain('aria-label="Quiz list"');
  expect(source).toContain('item is LearnerQuizOverviewItem');
  expect(source).toContain('learnerAssessmentEmptyMessage({kind,courseSelected:Boolean(activeCourseId),search,stateFilter})');
  expect(source).toContain('<article key={item.deliveryId+":"+item.id}');
  expect(source).toContain("sm:flex-row");
  expect(source).toContain('min-h-11');
  expect(source).not.toContain("<table");
 });
 it("retains published-results privacy, independent attempt history and deadline-safe quiz actions",()=>{
  expect(source).toContain("quizOverviewActionState(item,currentNowMs)");
  expect(source).toContain("learnerQuizMobileState(item,currentNowMs).detail");
  expect(source).toContain('!item.resultsPublished?"Not released"');
  expect(source).toContain('item.latestScore<=item.latestMaxScore');
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
