import {describe,expect,it} from "vitest";
import {selectLearnerLatestQuizAttempt} from "@/modules/courses/learner-latest-quiz-attempt-model";
describe("learner latest persisted quiz attempt",()=>{
 const rows=[
  {id:"second",attemptNumber:2,submittedAt:"2026-10-15T10:00:00Z"},
  {id:"first",attemptNumber:1,submittedAt:"2026-10-15T11:00:00Z"},
 ];
 it("does not depend on API response ordering or timestamp tie ordering",()=>{
  expect(selectLearnerLatestQuizAttempt(rows)?.id).toBe("second");
  expect(selectLearnerLatestQuizAttempt([...rows].reverse())?.id).toBe("second");
  expect(rows[0]?.id).toBe("second");
 });
 it("does not invent an attempt for no data or corrupt attempt number",()=>{
  expect(selectLearnerLatestQuizAttempt([])).toBeNull();
  expect(selectLearnerLatestQuizAttempt([{id:"bad",attemptNumber:NaN,submittedAt:"bad"}])).toBeNull();
 });
});
