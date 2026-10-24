import {describe,expect,it} from "vitest";
import {mergeMentorUnifiedPages,type MentorUnifiedNotification}
 from "@/modules/projects/mentor-unified-notification-model";
const make=(id:string,source:MentorUnifiedNotification["source"],
 time:string,read:boolean|null):MentorUnifiedNotification=>({
 id,source,title:id,description:id,occurredAt:time,
 actionHref:null,read,receiptKey:null,
});
describe("Unified Mentor notification pagination",()=>{
 it("sorts three independently paged sources newest first, deduplicating overlaps",()=>{
  const result=mergeMentorUnifiedPages(
   [make("new","PERSONAL","2026-10-24T12:00:00Z",false)],
   [make("old","ANNOUNCEMENT","2026-10-23T09:00:00Z",false),
    make("old","ANNOUNCEMENT","2026-10-23T09:00:00Z",false)],
   [make("middle","PERSONAL","2026-10-24T10:00:00Z",true)],
   false);
  expect(result.map(item=>item.id)).toEqual(["new","middle","old"]);
 });
 it("does not show stale read items in the unread tab",()=>{
  expect(mergeMentorUnifiedPages([
    make("a","PERSONAL","2026-10-24T12:00:00Z",false)],
   [make("b","ANNOUNCEMENT","2026-10-24T11:00:00Z",true)],
   [make("c","PERSONAL","2026-10-24T10:00:00Z",null)],true)
  .map(item=>item.id)).toEqual(["a"]);
 });
 it("does not confuse the same ID across separate notification sources",()=>{
  const result=mergeMentorUnifiedPages(
   [make("same","PERSONAL","2026-10-24T12:00:00Z",false)],
   [make("same","ANNOUNCEMENT","2026-10-24T10:00:00Z",false)],
   [],false);
  expect(result).toHaveLength(2);
  expect(result.map(item=>item.source)).toEqual(["PERSONAL","ANNOUNCEMENT"]);
 });
 it("preserves first authoritative server-loaded state for duplicated rows",()=>{
  const result=mergeMentorUnifiedPages(
    [make("same","PERSONAL","2026-10-24T12:00:00Z",true)],
    [],[make("same","PERSONAL","2026-10-24T12:00:00Z",false)],false);
  expect(result[0]?.read).toBe(true);
 });
});
