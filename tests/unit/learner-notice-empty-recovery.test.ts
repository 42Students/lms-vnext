import {describe,it,expect} from "vitest";
import {learnerNoticeEmptyLabel} from "@/modules/placements/learner-notice-empty-label-model";
describe("learner college notice empty states",()=>{
 it("distinguishes a genuine absence of published scoped notices",()=>{
  expect(learnerNoticeEmptyLabel(0,false,"all")).toContain("No announcements from your placement cell yet.");
 });
 it("identifies a search mismatch when scoped college notices exist",()=>{
  expect(learnerNoticeEmptyLabel(8,false,"all",{search:"nothing",matchingTotal:0})).toContain("match this search");
 });
 it("does not confuse a placement-cell author filter with official placement-only notices",()=>{
  expect(learnerNoticeEmptyLabel(6,false,"placement-cell",{search:"x"})).toContain("placement cell match these filters");
 });
 it("distinguishes pinned and recent filter misses",()=>{
  expect(learnerNoticeEmptyLabel(3,true,"all",{matchingTotal:0})).toContain("No pinned");
  expect(learnerNoticeEmptyLabel(3,false,"all",{recent:true})).toContain("last 30 days");
 });
});