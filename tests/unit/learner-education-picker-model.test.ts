import {describe,it,expect} from "vitest";
import {learnerEducationValidationProblem,LEARNER_EDUCATION_TYPES}
 from "@/modules/people/learner-education-picker-model";
describe("LEARNER-profile-misc-06 education examination validation",()=>{
 it("preserves 10th, 12th/Diploma and degree choices",()=>{
  expect(LEARNER_EDUCATION_TYPES).toEqual(["10th","12th","Diploma","UG","PG"]);
 });
 it("guards CGPA, percentage, impossible year order and maximum",()=>{
  const base={educationType:"UG",institution:"ABC Institute",gradingType:"CGPA",maxGrade:"10"};
  expect(learnerEducationValidationProblem({...base,gradeObtained:"11"})?.field).toBe("gradeObtained");
  expect(learnerEducationValidationProblem({...base,gradingType:"Percentage",gradeObtained:"101",maxGrade:"100"})?.field).toBe("gradeObtained");
  expect(learnerEducationValidationProblem({...base,gradeObtained:"8",maxGrade:"7"})?.field).toBe("maxGrade");
  expect(learnerEducationValidationProblem({...base,gradeObtained:"8",startYear:"2026",endYear:"2023"})?.field).toBe("endYear");
  expect(learnerEducationValidationProblem({...base,gradeObtained:"8.5"})).toBeNull();
 });
 it("requires every field used by placement eligibility checks with exact legacy errors",()=>{
  const entry={educationType:"UG",institution:"ABC",gradingType:"CGPA",
   gradeObtained:"8.0",maxGrade:"10"};
  const cases=[
   ["educationType","Education type is required"],
   ["institution","Institution name is required"],
   ["gradingType","Grading type is required"],
   ["gradeObtained","Grade obtained is required"],
   ["maxGrade","Max grade is required for job screening"],
  ] as const;
  expect(learnerEducationValidationProblem({...entry,educationType:"B.Tech"})?.message)
   .toBe("Choose a valid education type");
  for(const [key,message] of cases){
    expect(learnerEducationValidationProblem({...entry,[key]:""})?.message).toBe(message);
  }
 });
});
