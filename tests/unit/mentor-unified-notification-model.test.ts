import {describe,expect,it} from "vitest";
import {mentorUnifiedNotificationGroups,sortMentorUnifiedNotifications} from
  "@/modules/projects/mentor-unified-notification-model";

const row=(id:string,source:"PERSONAL"|"ATTENTION"|"ANNOUNCEMENT",
  occurredAt:string,read:boolean|null=false)=>({
  id,source,title:id,description:id,occurredAt,actionHref:null,read,receiptKey:null,
});
describe("Mentor merged notification chronology",()=>{
 it("merges three authorized source families newest first within IST days",()=>{
  const rows=[
    row("yesterday","PERSONAL","2026-10-23T17:00:00Z"),
    row("latest","ATTENTION","2026-10-24T05:00:00Z"),
    row("notice","ANNOUNCEMENT","2026-10-24T04:00:00Z"),
  ];
  expect(sortMentorUnifiedNotifications(rows).map(item=>item.id))
   .toEqual(["latest","notice","yesterday"]);
  const groups=mentorUnifiedNotificationGroups(rows);
  expect(groups).toHaveLength(2);
  expect(groups[0]?.items.map(item=>item.id)).toEqual(["latest","notice"]);
  expect(groups[1]?.items.map(item=>item.id)).toEqual(["yesterday"]);
 });
 it("respects IST midnight, not UTC midnight",()=>{
  const rows=[
    row("before","PERSONAL","2026-10-23T18:29:00Z"),
    row("after","ATTENTION","2026-10-23T18:31:00Z"),
  ];
  expect(mentorUnifiedNotificationGroups(rows)).toHaveLength(2);
 });
 it("does not mutate caller order",()=>{
  const rows=[
    row("old","PERSONAL","2026-10-23T10:00:00Z"),
    row("new","ATTENTION","2026-10-24T10:00:00Z"),
  ];
  sortMentorUnifiedNotifications(rows);
  expect(rows.map(item=>item.id)).toEqual(["old","new"]);
 });
});
