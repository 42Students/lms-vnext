import {describe,expect,it} from "vitest";
import {mentorUnifiedNotificationGroups,sortMentorUnifiedNotifications,
  mentorUnifiedOpenReadRequest,mergeMentorUnifiedPages} from
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
 it("merges 120 paginated college notifications without duplicate rows",()=>{
  const date=(i:number)=>new Date(Date.UTC(2026,9,24,12)-i*60000).toISOString();
  const first=Array.from({length:100},(_,i)=>row("ann-"+i,"ANNOUNCEMENT",date(i)));
  const older=Array.from({length:20},(_,i)=>row("ann-"+(i+100),"ANNOUNCEMENT",date(i+100)));
  const merged=mergeMentorUnifiedPages(first,[...older,older[0]!],[],false);
  expect(merged).toHaveLength(120);
  expect(merged[0]?.id).toBe("ann-0");
  expect(merged.at(-1)?.id).toBe("ann-119");
 });
 it("hides read items from unread paginated views",()=>{
  const first=[row("first","ANNOUNCEMENT","2026-10-24T12:00:00Z")];
  const older=[row("read","ANNOUNCEMENT","2026-10-24T11:00:00Z",true),
    row("older","ANNOUNCEMENT","2026-10-24T10:00:00Z")];
  expect(mergeMentorUnifiedPages(first,older,[],true).map(item=>item.id))
    .toEqual(["first","older"]);
 });

});
