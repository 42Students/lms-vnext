import {describe,expect,it} from "vitest";
import {groupHrNotificationPage} from "@/modules/placements/hr-notification-groups-model";
describe("HR grouped notification page",()=>{
 it("groups already-authorized notifications by drive without altering source",()=>{
  const items=[
   {id:"1",jobId:"a",title:"Engineering",unread:true},
   {id:"2",jobId:"b",title:"Design",unread:false},
   {id:"3",jobId:"a",title:"Engineering",unread:false},
  ];
  const groups=groupHrNotificationPage(items);
  expect(groups.map(g=>g.jobId)).toEqual(["a","b"]);
  expect(groups[0]?.items.map(g=>g.id)).toEqual(["1","3"]);
  expect(groups[0]?.unread).toBe(1);
  expect(items[0]?.id).toBe("1");
 });
 it("does not fabricate a thread or new records",()=>{
  expect(groupHrNotificationPage([])).toEqual([]);
 });
});
