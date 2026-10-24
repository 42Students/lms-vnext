import {describe,expect,it} from "vitest";
import {nextMentorReviewFocus} from
 "@/modules/projects/mentor-review-next-focus-model";
describe("Mentor Board post-review focus",()=>{
 const visible=[
  {id:"a",status:"IN_REVIEW"},
  {id:"b",status:"TODO"},
  {id:"c",status:"IN_REVIEW"},
  {id:"d",status:"BLOCKED"},
  {id:"e",status:"IN_REVIEW"},
 ];
 it("advances to the next visible task needing approval",()=>{
  expect(nextMentorReviewFocus(visible,"a")).toBe("c");
  expect(nextMentorReviewFocus(visible,"c")).toBe("e");
 });
 it("wraps after the final review task to the earliest remaining one",()=>{
  expect(nextMentorReviewFocus(visible,"e")).toBe("a");
 });
 it("excludes the reviewed item when it was the only review pending",()=>{
  expect(nextMentorReviewFocus([{id:"only",status:"IN_REVIEW"}],"only"))
    .toBeNull();
 });
 it("never selects a filtered-out task or non-review state",()=>{
  expect(nextMentorReviewFocus([{id:"a",status:"IN_REVIEW"},
   {id:"b",status:"DONE"}],"a")).toBeNull();
 });
 it("starts at first review task when the previous selection disappeared",()=>{
  expect(nextMentorReviewFocus(visible,"missing")).toBe("a");
 });
});
