import {describe,it,expect} from "vitest";
import {learnerEducationValidationProblem,LEARNER_EDUCATION_TYPES}
 from "@/modules/people/learner-education-picker-model";
describe("LEARNER-profile-misc-06 education examination validation",()=>{
 it("preserves 10th, 12th/Diploma and degree choices",()=>{
  expect(LEARNER_EDUCATION_TYPES).toEqual(["10th","12th","Diploma","UG","PG"]);
 });
 it("guards CGPA, percentage, impossible year order and maximum",()=>{
  expect(learnerEducationValidationProblem({gradingType:"CGPA",gradeObtained:"11"})?.field).toBe("gradeObtained");
  expect(learnerEducationValidationProblem({gradingType:"Percentage",gradeObtained:"101"})?.field).toBe("gradeObtained");
  expect(learnerEducationValidationProblem({gradingType:"CGPA",gradeObtained:"8",maxGrade:"7"})?.field).toBe("maxGrade");
  expect(learnerEducationValidationProblem({startYear:"2026",endYear:"2023"})?.field).toBe("endYear");
  expect(learnerEducationValidationProblem({gradingType:"CGPA",gradeObtained:"8.5"})).toBeNull();
 });
});
