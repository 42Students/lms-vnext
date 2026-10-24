import {describe,expect,it} from "vitest";
import {recordedMentorStudentLead} from
 "@/modules/projects/mentor-student-lead-label-model";

describe("Mentor team explicit student lead marker",()=>{
 it("renders only saved learner lead designations",()=>{
  for(const label of ["Lead"," TEAM LEAD ","Student lead","Team Leader"])
   expect(recordedMentorStudentLead({role:"LEARNER",roleLabel:label})).toBe(true);
 });
 it("does not infer lead from primary Mentor, generic learner or task ownership",()=>{
  expect(recordedMentorStudentLead({role:"MENTOR",roleLabel:"Lead"})).toBe(false);
  expect(recordedMentorStudentLead({role:"LEARNER",roleLabel:null})).toBe(false);
  expect(recordedMentorStudentLead({role:"LEARNER",roleLabel:"Developer"})).toBe(false);
  expect(recordedMentorStudentLead({role:"LEARNER",roleLabel:"Leadership candidate"}))
   .toBe(false);
 });
});
