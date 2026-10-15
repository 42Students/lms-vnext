import {describe,it,expect} from "vitest";
import {filterLearnerInbox} from "@/modules/activity/learner-notification-inbox-model";
import {learnerPinnedAnnouncementPreview} from "@/modules/activity/learner-pinned-announcements-model";
const rows=[
 {id:"announcement:1",title:"Pinned term",body:"Message",module:"ANNOUNCEMENTS",readAt:null,source:"ANNOUNCEMENT" as const,pinned:true,createdAt:"2026-10-15T00:00:00Z"},
 {id:"notification:1",title:"Job round",body:"Interview",module:"PLACEMENTS",readAt:null,createdAt:"2026-10-14T00:00:00Z"},
];
describe("learner pinned preview respects inbox filters",()=>{
 it("does not show pinned college notices under Jobs",()=>{
  const visible=filterLearnerInbox(rows,{category:"job",unread:"all",q:""});
  expect(learnerPinnedAnnouncementPreview(visible)).toEqual([]);
 });
 it("does not feature announcements under personal unread filter",()=>{
  const visible=filterLearnerInbox(rows,{category:"all",unread:"unread",q:""});
  expect(learnerPinnedAnnouncementPreview(visible)).toEqual([]);
 });
 it("shows only pinned notices that match the active title search",()=>{
  expect(learnerPinnedAnnouncementPreview(filterLearnerInbox(rows,{category:"general",unread:"all",q:"term"})).map(x=>x.id)).toEqual(["announcement:1"]);
 });
});