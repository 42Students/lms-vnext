import {describe,expect,it} from "vitest";
import {learnerProfileDeletePrompt} from "@/modules/people/learner-profile-delete-confirm-model";
describe("Learner profile destructive delete safeguard",()=>{
 it("requests confirmation before deleting a saved item",()=>{
  expect(learnerProfileDeletePrompt("skills",true)).toContain("cannot be undone");
 });
 it("does not propose deleting a stale missing saved item",()=>{
  expect(learnerProfileDeletePrompt("education",false)).toBeNull();
 });
});
