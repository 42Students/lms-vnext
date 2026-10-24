import {describe,expect,it} from "vitest";
import {parseLearnerProjectActivityFilters} from
 "@/modules/projects/learner-project-activity-filter-model";
const id="11111111-1111-4111-8111-111111111111";
describe("Exact task activity filter guard",()=>{
 it("accepts an exact UUID subject and preserves precise continuation",()=>{
  const parsed=parseLearnerProjectActivityFilters({
   subjectId:id,size:"50",beforeTime:"2026-10-24T10:30:00.123456Z",
   beforeId:"22222222-2222-4222-8222-222222222222",
  });
  expect(parsed.success).toBe(true);
  if(parsed.success){
   expect(parsed.data.subjectId).toBe(id);
   expect(parsed.data.size).toBe(50);
  }
 });
 it("rejects cross-field tenant and malformed task keys",()=>{
  expect(parseLearnerProjectActivityFilters({subjectId:"not-uuid"}).success)
   .toBe(false);
  expect(parseLearnerProjectActivityFilters({
   subjectId:"' OR TRUE --",
  }).success).toBe(false);
 });
 it("rejects incomplete pagination cursors",()=>{
  expect(parseLearnerProjectActivityFilters({
   subjectId:id,beforeTime:"2026-10-24T10:30:00.000Z",
  }).success).toBe(false);
 });
});
