import { test } from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const overview=readFileSync(new URL(
  "../src/components/courses/learner-assessment-overview.tsx",import.meta.url),"utf8");
const page=readFileSync(new URL(
  "../src/app/(authenticated)/learn/allAssignments/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL(
  "../src/components/courses/learner-legacy-assignment-list.module.css",import.meta.url),"utf8");

test("assignment list restores old LMS compact row hierarchy",()=>{
  assert.match(overview,/kind==="ASSIGNMENT"\s*\?\s*\(\s*<div role="region" className=\{legacyStyles\.list\}/);
  assert.match(overview,/className=\{legacyStyles\.row\}/);
  assert.match(overview,/className=\{legacyStyles\.iconWrap\}/);
  assert.match(overview,/className=\{legacyStyles\.content\}/);
  assert.match(overview,/className=\{legacyStyles\.meta\}/);
  assert.match(overview,/className=\{legacyStyles\.state\}/);
  assert.match(overview,/className=\{legacyStyles\.cta\}/);
  assert.doesNotMatch(overview,/min-w-0 rounded-\[12px\] border border-border bg-surface px-4 py-4 md:px-5/);
  assert.match(css,/\.row\s*\{[^}]*display:\s*flex/);
  assert.match(css,/\.iconWrap\s*\{[^}]*width:\s*40px/);
});

test("assignment cards retain guarded, accessible drawer open action",()=>{
  assert.match(overview,/aria-label=\{"View assignment: "\+\(item\.title\.trim\(\)\|\|"Untitled"\)\}/);
  assert.match(overview,/setSelectedAssignmentKey\(item\.deliveryId\+":"\+item\.id\)/);
  assert.match(overview,/<Drawer\s/);
  assert.match(overview,/<AssignmentSubmissionControl/);
  assert.match(overview,/<LearnerAssignmentDrawerResources/);
  assert.match(overview,/learnerAssessmentDrawerSelectionAllowed/);
});

test("legacy default is quiet but advanced vNext controls remain accessible",()=>{
  assert.match(overview,/<details className=\{legacyStyles\.advancedTools\}>/);
  assert.match(overview,/<summary>More assignment filters<\/summary>/);
  assert.match(overview,/\{metricsDisclosure\}/);
  assert.match(overview,/\{advancedControls\}/);
  assert.match(overview,/<NeedsDoingChips/);
  assert.match(overview,/<Disclosure title="State · Sort"/);
  assert.match(overview,/\{kind==="QUIZ"\?courseSelector:null\}/);
  assert.match(overview,/<div className=\{legacyStyles\.coursePicker\}>\{courseSelector\}<\/div>/);
  assert.match(overview,/router\.push\(learnerAssessmentCourseHref\(kind,event\.target\.value\|\|null\)\)/);
});

test("quiz listing structure and filters still exist independently",()=>{
  assert.match(overview,/aria-label="Quiz list"/);
  assert.match(overview,/quizOverviewActionState/);
  assert.match(overview,/Attempt history/);
  assert.match(overview,/kind==="QUIZ" \? \(/);
});

test("header shows legacy count/month metrics, without extra course summary pills",()=>{
  assert.match(page,/title="All Assignments"/);
  assert.match(page,/\{totalAssignments\} \{totalAssignments===1\?"Assignment":"Assignments"\}/);
  assert.match(page,/\{createdThisMonth\} this month/);
  assert.doesNotMatch(page,/coursesCount/);
  assert.match(page,/\{totalPages>1\?\(/);
  assert.match(page,/assignmentFilesRuntimeEnabled\(\)/);
});
