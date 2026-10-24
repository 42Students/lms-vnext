import {describe,expect,it} from "vitest";
import {mentorUnifiedNotificationGroups,sortMentorUnifiedNotifications,
  mentorUnifiedOpenReadRequest} from
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
 it("opens personal, project and college notifications through their own saved read action",()=>{
  const personal={...row(
    "11111111-1111-4111-8111-111111111111","PERSONAL",
    "2026-10-24T11:00:00Z"),receiptKey:null};
  const project={...row("review-task","ATTENTION",
    "2026-10-24T11:00:00Z"),receiptKey:"attention:project:task@version1"};
  const college={...row("notice","ANNOUNCEMENT",
    "2026-10-24T11:00:00Z"),receiptKey:"announcement:notice@revision1"};
  expect(mentorUnifiedOpenReadRequest(personal)).toEqual({
   url:"/api/mentor/notifications/"+personal.id+"/read",
  });
  for(const item of [project,college]){
   expect(mentorUnifiedOpenReadRequest(item)).toEqual({
     url:"/api/mentor/notifications/source-read",
     body:JSON.stringify({key:item.receiptKey}),
   });
  }
  expect(mentorUnifiedOpenReadRequest({...project,read:true})).toBeNull();
  expect(mentorUnifiedOpenReadRequest({...college,receiptKey:null})).toBeNull();
  expect(mentorUnifiedOpenReadRequest({...personal,id:"not-a-uuid"})).toBeNull();
 });
});
