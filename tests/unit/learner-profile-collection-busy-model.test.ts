import {describe,expect,it} from "vitest";
import {learnerProfileCollectionMayEdit} from "@/modules/people/learner-profile-collection-busy-model";
describe("learner profile collection edit availability",()=>{
 it("allows edits only while no saved-document or contact mutation is active",()=>{
  expect(learnerProfileCollectionMayEdit(false,false)).toBe(true);
  expect(learnerProfileCollectionMayEdit(true,false)).toBe(false);
  expect(learnerProfileCollectionMayEdit(false,true)).toBe(false);
  expect(learnerProfileCollectionMayEdit(true,true)).toBe(false);
 });
});
