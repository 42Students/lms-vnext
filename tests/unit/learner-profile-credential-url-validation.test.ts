import {describe,it,expect} from "vitest";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
describe("Learner saved Profile URL safety",()=>{
 it("accepts legitimate empty or http(s) profile links",()=>{
  expect(learnerProfileDocumentSchema.safeParse({socialProfiles:{githubUrl:"https://github.com/example"}}).success).toBe(true);
  expect(learnerProfileDocumentSchema.safeParse({socialProfiles:{portfolioUrl:"http://example.org"}}).success).toBe(true);
 });
 it("rejects credentials and executable schemes in persisted Profile links",()=>{
  for(const value of ["https://user:password@example.org","https://user@example.org","javascript:alert(1)"]){
   const result=learnerProfileDocumentSchema.safeParse({socialProfiles:{githubUrl:value}});
   expect(result.success).toBe(false);
  }
 });
});
