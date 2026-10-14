import {describe,it,expect} from "vitest";
import {learnerTaskCriteriaPreview} from "@/modules/projects/learner-task-criteria-model";
describe("learner task inline criteria",()=>{
 it("only shows authored criteria",()=>{
  expect(learnerTaskCriteriaPreview("  Verify retries  ")).toBe("Verify retries");
  expect(learnerTaskCriteriaPreview(null)).toBeNull();
  expect(learnerTaskCriteriaPreview(" ")).toBeNull();
 });
 it("does not interpret supplied HTML as markup",()=>{
  expect(learnerTaskCriteriaPreview("<script>alert(1)</script>")).toBe("<script>alert(1)</script>");
 });
});
