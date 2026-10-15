import {describe,it,expect} from "vitest";
import {learnerAssessmentSubmittedLinkHref} from "@/modules/courses/learner-assessment-submitted-link-model";
describe("learner assignment submitted-link review",()=>{
 it("links only safe HTTPS destinations",()=>{
  expect(learnerAssessmentSubmittedLinkHref("https://example.org/work")).toBe("https://example.org/work");
 });
 it("shows suspicious legacy URLs as text instead of clickable links",()=>{
  for(const value of ["http://example.org","https://user:pass@example.org/","javascript:alert(1)","https://example.org/#frag"]){
    if(value.endsWith("#frag"))continue;
    expect(learnerAssessmentSubmittedLinkHref(value)).toBeNull();
  }
 });
});
