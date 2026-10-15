import {describe,expect,it} from "vitest";
import {learnerDiscussionCanPost} from "@/modules/courses/learner-discussion-capability-model";
describe("learner Discussion persisted posting capability",()=>{
 it("grants posting only for an explicit authorized Boolean",()=>{
  expect(learnerDiscussionCanPost(true)).toBe(true);
  for(const value of [false,undefined,null,"true",1,{}]){
   expect(learnerDiscussionCanPost(value)).toBe(false);
  }
 });
});
