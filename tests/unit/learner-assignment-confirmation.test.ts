import {describe,it,expect} from "vitest";
import {learnerAssignmentFinalConfirmation} from "@/modules/courses/learner-assignment-confirmation-model";
describe("learner immutable assignment confirmation",()=>{
 it("makes each final action explicit",()=>{
  expect(learnerAssignmentFinalConfirmation("TEXT")).toContain("written response");
  expect(learnerAssignmentFinalConfirmation("LINK")).toContain("HTTPS link");
  expect(learnerAssignmentFinalConfirmation("TEXT")).toContain("cannot replace");
 });
});
