import {describe,it,expect} from "vitest";
import {learnerProfileDocumentSchema,learnerProfileEducationWriteSchema}
 from "@/modules/people/profile-validation";
import {learnerProfileSectionEditSchema} from "@/modules/people/learner-profile-section-model";
const id="550e8400-e29b-41d4-a716-446655440000";
describe("LEARNER-profile-misc-R03 read legacy, validate only education writes",()=>{
 const old={id,educationType:"",institution:"",gradingType:"",gradeObtained:"",maxGrade:""};
 const full={...old,educationType:"UG",institution:"ABC University",
  gradingType:"CGPA",gradeObtained:"8.3",maxGrade:"10"};
 it("still reads incomplete previously-saved education instead of breaking profile",()=>{
  const normalized=learnerProfileDocumentSchema.parse({education:[old]});
  expect(normalized.education).toHaveLength(1);
 });
 it("rejects incomplete new entries with legacy required messages",()=>{
  const failed=learnerProfileEducationWriteSchema.safeParse([old]);
  expect(failed.success).toBe(false);
  if(!failed.success)expect(failed.error.issues[0]?.message).toBe("Education type is required");
 });
 it("accepts a corrected write against incomplete saved baseline",()=>{
  expect(learnerProfileSectionEditSchema.safeParse({
   confirmed:true,section:"education",items:[full],expectedItems:[old],
  }).success).toBe(true);
 });
});
