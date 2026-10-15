import {describe,it,expect} from "vitest";
import {learnerAssessmentSubmittedLinkHref} from "@/modules/courses/learner-assessment-submitted-link-model";
describe("standalone Assignment saved link rendering policy",()=>{
 it("allows only credential-free HTTPS URLs",()=>{
  expect(learnerAssessmentSubmittedLinkHref("https://example.edu/report")).toBe("https://example.edu/report");
  expect(learnerAssessmentSubmittedLinkHref("javascript:alert(1)")).toBeNull();
  expect(learnerAssessmentSubmittedLinkHref("http://example.edu")).toBeNull();
  expect(learnerAssessmentSubmittedLinkHref("https://user:password@example.edu")).toBeNull();
 });
});
