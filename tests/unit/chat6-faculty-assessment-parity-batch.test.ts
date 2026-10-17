import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
describe("Faculty assessment legacy parity follow-up",()=>{
 it("FAC-assessments-11 presents legacy assessment and course total pills above course breakdown",()=>{
  const ui=src("src/components/courses/faculty-assessment-overview.tsx");
  expect(ui).toContain('aria-label={kind === "QUIZ" ? "Quiz totals" : "Assignment totals"}');
  expect(ui).toContain('items.length === 1 ? "Quiz" : "Quizzes"');
  expect(ui).toContain('items.length === 1 ? "Assignment" : "Assignments"');
  expect(ui).toContain('"Quizzes by Course":"Assignments by Course"');
 });
 it("FAC-assessments-14 saves routine drafts without redundant checkbox and confirm dialog",()=>{
  const quiz=src("src/components/courses/faculty-choice-quiz-builder.tsx");
  const assignment=src("src/components/courses/faculty-assignment-editor.tsx");
  expect(quiz).not.toContain("I confirm these choices");
  expect(assignment).not.toContain("I confirm this Section assignment change");
  expect(quiz).not.toContain('if(!confirmed){setError("Confirm the action before saving.")');
  expect(assignment).not.toContain('if(!confirmed){setError("Confirm the selected action first.")');
  expect(quiz).toContain("confirmed:true");
  expect(quiz).toContain('if((action==="ARCHIVE"||action==="CLOSE")&&!window.confirm(warning))return;');
  expect(assignment).toContain("confirmed:true");
  expect(assignment).toContain("facultyAssignmentArchiveWarning");
 });
 it("FAC-assessments-20 retains approved section-scoped quiz audience",()=>{
  const overview=src("src/components/courses/faculty-assessment-overview.tsx");
  const policy=src("docs/audit/owner-decisions-resolved.md");
  expect(overview).toContain('"Shared Offering"');
  expect(overview).toContain("item.facultyOwned");
  expect(policy).toContain("OD-38");
 });
});
