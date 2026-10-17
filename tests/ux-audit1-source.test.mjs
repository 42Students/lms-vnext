import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path,"utf8");
const critical = [
  "src/components/courses/learner-quiz-attempt.tsx",
  "src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx",
  "src/components/placements/placement-drive-workspace.tsx",
  "src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx",
  "src/app/(authenticated)/tpo/students/page.tsx",
  "src/components/tpo/tpo-students-spreadsheet.tsx",
  "src/components/tpo/tpo-spreadsheet-grid.tsx",
  "src/components/people/faculty-profile-editor.tsx",
  "src/components/people/faculty-profile-text-section.tsx",
  "src/components/people/faculty-profile-repeatable.tsx",
  "src/components/people/faculty-profile-metadata.tsx",
  "src/components/people/faculty-profile-skills.tsx",
];
test("UX-PLAYBOOK-20 audited quiz, profile and external workflows use no native prompts or popups",()=>{
  for(const file of critical){
    const src=read(file);
    assert.doesNotMatch(src,/window\.(?:confirm|alert|prompt|open)\s*\(/,file);
    assert.doesNotMatch(src,/target\s*=\s*["']_blank["']/,file);
  }
});
test("UX-PLAYBOOK-21 TPO mobile renders actual cards, not the 52rem grid",()=>{
  const page=read("src/app/(authenticated)/tpo/students/page.tsx");
  assert.match(page,/hidden overflow-x-auto sm:block/);
  assert.match(page,/sm:hidden/);
  const grid=read("src/components/tpo/tpo-spreadsheet-grid.tsx");
  assert.match(grid,/mobilePrimaryKeys/);
  assert.match(grid,/aria-label="Row actions"/);
});
test("UX-PLAYBOOK-22 typography aliases keep old LMS teal but safe contrast",()=>{
  const css=read("src/app/globals.css");
  assert.match(css,/--lms-primary: #26bac7/);
  assert.match(css,/--primary-foreground: var\(--lms-on-primary\)/);
  assert.match(css,/--color-primary-text: var\(--lms-link-text\)/);
});
test("UX-PLAYBOOK-23 live quiz leaves for an owned route and preserves draft",()=>{
  const quiz=read("src/components/courses/learner-quiz-attempt.tsx");
  assert.doesNotMatch(quiz,/router\.back\(/);
  assert.match(quiz,/router\.replace\("\/learn\/allQuizzes"\)/);
  assert.match(quiz,/ConfirmDialog/);
});
