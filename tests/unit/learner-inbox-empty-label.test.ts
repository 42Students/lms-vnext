import {describe,expect,it} from "vitest";
import {learnerInboxEmptyLabel} from "@/modules/activity/learner-inbox-empty-label-model";
describe("learner inbox empty versus filtered-empty",()=>{
 it("does not claim first-run when a persisted notification was filtered out",()=>{
  expect(learnerInboxEmptyLabel({total:8,category:"job",unread:"all",search:""}))
   .toContain("Try another category");
 });
 it("distinguishes no data from no unread messages",()=>{
  expect(learnerInboxEmptyLabel({total:0,category:"all",unread:"all",search:""})).toContain("No notifications yet");
  expect(learnerInboxEmptyLabel({total:3,category:"all",unread:"unread",search:""})).toContain("No unread personal");
 });
 it("does not reveal whether a missing search term belongs to another college",()=>{
  expect(learnerInboxEmptyLabel({total:2,category:"all",unread:"all",search:"private"})).toContain("No notifications match");
 });
});