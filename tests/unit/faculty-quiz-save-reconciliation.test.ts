import {describe,expect,it} from "vitest";
import {facultyQuizSavedFromCommand,facultyQuizReconcileRows} from "@/modules/courses/faculty-quiz-builder-model";
const id="00000000-0000-4000-8000-000000000001";
const lessonId="00000000-0000-4000-8000-000000000002";
const saved={id,lessonId,title:"New Quiz",description:null,dueAt:null,maxAttempts:2,
 sequence:0,status:"PUBLISHED" as const,updatedAt:"2026-10-15T10:00:00.000Z"};
describe("Faculty Quiz persisted write reconciliation",()=>{
 it("reads the returned persisted version and exact lifecycle",()=>{
  expect(facultyQuizSavedFromCommand({quiz:saved})).toEqual(saved);
  expect(facultyQuizSavedFromCommand({quiz:{...saved,updatedAt:"not-a-date"}})).toBeNull();
 });
 it("supersedes the stale visible revision rather than keeping duplicate records",()=>{
  const before=[{...saved,status:"DRAFT",updatedAt:"2026-10-15T09:00:00.000Z"}];
  const merged=facultyQuizReconcileRows(before,saved);
  expect(merged).toEqual([saved]);
  expect(before[0]?.status).toBe("DRAFT");
 });
});
