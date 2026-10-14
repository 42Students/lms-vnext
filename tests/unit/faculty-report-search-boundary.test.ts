import { describe, expect, it } from "vitest";
import { facultySubmissionReportSearchSchema } from "@/modules/courses/faculty-assignment-submissions-model";
import { facultyQuizAttemptSearchSchema } from "@/modules/courses/faculty-quiz-attempts-model";
const id="10000000-0000-4000-8000-000000000001";
describe("Faculty report drill-in search boundaries", () => {
 it("rejects repeated selectors instead of taking the first value", () => {
  for(const schema of [facultySubmissionReportSearchSchema,facultyQuizAttemptSearchSchema]) {
   expect(schema.safeParse({deliveryId:[id,id]}).success).toBe(false);
   expect(schema.safeParse({deliveryId:id,page:["1","2"]}).success).toBe(false);
   expect(schema.safeParse({deliveryId:id,collegeId:id}).success).toBe(false);
  }
  expect(facultySubmissionReportSearchSchema.safeParse({deliveryId:id,filter:["ALL","GRADED"]}).success).toBe(false);
 });
 it("does not let query values override path-owned assessment IDs", () => {
  expect(facultySubmissionReportSearchSchema.safeParse({deliveryId:id,assignmentId:id}).success).toBe(false);
  expect(facultyQuizAttemptSearchSchema.safeParse({deliveryId:id,quizId:id}).success).toBe(false);
 });
 it("retains valid Section filters, integer pages and defaults", () => {
  expect(facultySubmissionReportSearchSchema.parse({deliveryId:id,filter:"LATE",page:"2"})).toEqual({deliveryId:id,filter:"LATE",page:2});
  expect(facultyQuizAttemptSearchSchema.parse({deliveryId:id})).toEqual({deliveryId:id,page:1});
  expect(facultyQuizAttemptSearchSchema.safeParse({deliveryId:id,page:"1.5"}).success).toBe(false);
 });
});
