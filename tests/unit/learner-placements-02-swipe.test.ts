import {describe,it,expect} from "vitest";
import {learnerPlacementSwipeDestination} from "@/modules/placements/learner-placements-swipe-model";
const tabs=["/learn/my-placements","/learn/my-placements/jobs","/learn/my-placements/applications",
 "/learn/my-placements/schedule","/learn/my-placements/offers",
 "/learn/my-placements/announcements","/learn/my-placements/placement"];
describe("LEARNER-placements-02 touch navigation",()=>{
 it("LEARNER-placements-02 moves between adjacent tabs without skipping",()=>{
  expect(learnerPlacementSwipeDestination(tabs[1]!, -100,0,tabs)).toBe(tabs[2]);
  expect(learnerPlacementSwipeDestination(tabs[1]!, 100,0,tabs)).toBe(tabs[0]);
 });
 it("LEARNER-placements-02 does not navigate on scroll or accidental jitter",()=>{
  expect(learnerPlacementSwipeDestination(tabs[1]!, -20,0,tabs)).toBeNull();
  expect(learnerPlacementSwipeDestination(tabs[1]!, -90,90,tabs)).toBeNull();
 });
 it("LEARNER-placements-02 stops at Home and Placement cell boundaries",()=>{
  expect(learnerPlacementSwipeDestination(tabs[0]!, 100,0,tabs)).toBeNull();
  expect(learnerPlacementSwipeDestination(tabs[6]!, -100,0,tabs)).toBeNull();
 });
 it("LEARNER-placements-02 resolves nested application routes from their parent tab",()=>{
  expect(learnerPlacementSwipeDestination("/learn/my-placements/applications/abc",-90,0,tabs)).toBe(tabs[3]);
 });
});
