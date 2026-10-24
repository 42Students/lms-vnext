import {describe,expect,it} from "vitest";
import {canSaveMentorResourceEntry,mentorResourceEffectiveStatus} from
 "@/modules/projects/mentor-resource-entry-model";
describe("Mentor resource placeholder entry",()=>{
 it("allows file types without URL or notes but stores an unattached draft",()=>{
  for(const type of ["FILE","DOCUMENT","PDF","DOC","PPT","VIDEO"] as const){
   expect(canSaveMentorResourceEntry({type,description:"",url:""})).toBe(true);
   expect(mentorResourceEffectiveStatus({type,description:"",url:"",
     selectedStatus:"ACTIVE"})).toBe("DRAFT");
  }
 });
 it("never grants this exception to learner resource creation",()=>{
  expect(canSaveMentorResourceEntry({
   type:"FILE",description:"",url:"",isLearner:true,
  })).toBe(false);
 });
 it("requires a description or URL for all link/note/code/environment modes",()=>{
  for(const type of ["LINK","NOTE","CODE","ENVIRONMENT",""] as const){
   expect(canSaveMentorResourceEntry({type,description:"",url:""})).toBe(false);
   expect(canSaveMentorResourceEntry({type,description:"Instructions",url:""}))
     .toBe(true);
  }
 });
 it("keeps chosen status if a real link or description is present",()=>{
  expect(mentorResourceEffectiveStatus({
   type:"FILE",description:"",url:"https://example.org/report.pdf",
   selectedStatus:"ACTIVE",
  })).toBe("ACTIVE");
  expect(mentorResourceEffectiveStatus({
   type:"DOCUMENT",description:"Please read",url:"",
   selectedStatus:"ARCHIVED",
  })).toBe("ARCHIVED");
 });
});
