import {describe,it,expect} from "vitest";
import {learnerAssessmentSubmittedLinkHref} from "@/modules/courses/learner-assessment-submitted-link-model";
describe("learner assignment submitted-link review",()=>{
 it("links only safe HTTPS destinations",()=>{
  expect(learnerAssessmentSubmittedLinkHref("https://example.org/work")).toBe("https://example.org/work");
  expect(learnerAssessmentSubmittedLinkHref("https://example.org/#section")).toBe("https://example.org/#section");
 });
 it("shows suspicious legacy URLs as text instead of clickable links",()=>{
  for(const value of ["http://example.org","https://user:pass@example.org/","javascript:alert(1)"]){
    expect(learnerAssessmentSubmittedLinkHref(value)).toBeNull();
  }
 });
});
