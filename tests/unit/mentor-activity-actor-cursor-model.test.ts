import {describe,expect,it} from "vitest";
import {parseLearnerProjectActivityFilters}
 from "@/modules/projects/learner-project-activity-filter-model";
const actor="11111111-1111-4111-8111-111111111111";
describe("Mentor full Activity actor queries",()=>{
 it("accepts a bounded current or historical author UUID",()=>{
  const parsed=parseLearnerProjectActivityFilters({actorUserId:actor,size:"100"});
  expect(parsed.success).toBe(true);
  if(parsed.success)expect(parsed.data.actorUserId).toBe(actor);
 });
 it("rejects malformed actor selectors instead of searching another tenant",()=>{
  for(const bad of ["","../../admin","' OR 1=1","someone@college.edu"]){
   const parsed=parseLearnerProjectActivityFilters({actorUserId:bad});
   if(bad==="")expect(parsed.success).toBe(true);
   else expect(parsed.success).toBe(false);
  }
 });
 it("combines the selected actor with a microsecond cursor",()=>{
  const parsed=parseLearnerProjectActivityFilters({
   actorUserId:actor,beforeTime:"2026-10-24T10:30:00.123456Z",
   beforeId:"22222222-2222-4222-8222-222222222222",
  });
  expect(parsed.success).toBe(true);
  if(parsed.success)expect(parsed.data.actorUserId).toBe(actor);
 });
 it("rejects missing cursor halves and invalid filter combinations",()=>{
  expect(parseLearnerProjectActivityFilters({
   actorUserId:actor,beforeTime:"2026-10-24T10:30:00Z",
  }).success).toBe(false);
 });
});
