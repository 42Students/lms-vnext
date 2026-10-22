import {describe,it,expect} from "vitest";
import {learnerNoticeAudienceLabel,learnerNoticeSourceLabel,learnerPlacementNoticeFeed} from "@/modules/placements/learner-placement-announcement-model";
describe("LEARNER-placements-47 notice origin and scope",()=>{
 it("LEARNER-placements-47 preserves actual college audience labels without guessing",()=>{
  expect(learnerNoticeSourceLabel("TPO")).toBe("Placement cell");
  expect(learnerNoticeAudienceLabel("LEARNER")).toBe("You");
  expect(learnerNoticeAudienceLabel("UNKNOWN")).toBeNull();
 });
 it("LEARNER-placements-47 marks actual edited notices only when updated version is recorded",()=>{
  const base={id:"n",title:"Notice",message:"Text",createdAt:new Date("2099-01-01"),
   updatedAt:new Date("2099-01-02"),isPinned:false,senderType:"TPO",receiverType:"COLLEGE"};
  expect(learnerPlacementNoticeFeed([{...base,version:2}])[0]?.updatedAt).toBe("2099-01-02T00:00:00.000Z");
  expect(learnerPlacementNoticeFeed([{...base,version:1}])[0]?.updatedAt).toBe("2099-01-02T00:00:00.000Z");
  expect(learnerPlacementNoticeFeed([{...base,version:1,updatedAt:base.createdAt}])[0]?.updatedAt).toBeNull();
 });
});