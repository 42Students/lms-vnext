import {describe,expect,it} from "vitest";
import {learnerPinnedAnnouncementPreview} from "@/modules/activity/learner-pinned-announcements-model";
describe("authorized college pinned announcement preview",()=>{
 it("never treats a pinned personal notification as college notice",()=>{
  const rows=[
   {id:"n",title:"Personal",createdAt:"2026-10-15T12:00:00Z",pinned:true},
   {id:"a",title:"College",createdAt:"2026-10-15T10:00:00Z",source:"ANNOUNCEMENT" as const,pinned:true},
   {id:"b",title:"Other",createdAt:"2026-10-15T11:00:00Z",source:"ANNOUNCEMENT" as const,pinned:false},
  ];
  expect(learnerPinnedAnnouncementPreview(rows).map(x=>x.id)).toEqual(["a"]);
  expect(rows[0].id).toBe("n");
 });
 it("sorts newest first and caps at three without mutating source",()=>{
  const rows=[1,2,3,4].map(n=>({id:String(n),title:"Pinned",pinned:true,source:"ANNOUNCEMENT" as const,
   createdAt:"2026-10-0"+n+"T08:00:00Z"}));
  expect(learnerPinnedAnnouncementPreview(rows).map(x=>x.id)).toEqual(["4","3","2"]);
  expect(rows[0].id).toBe("1");
 });
});
